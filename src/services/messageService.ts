import { collection, addDoc, setDoc, serverTimestamp, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { CryptoService, RatchetState } from './cryptoService';
import { MessageEnvelope, MessageType, MessageStatus } from '../types/message';
import { LocalDatabase } from './localDatabase';

export class MessageService {
  /**
   * Serializes a payload to string, encrypts it using the sender's ratchet chain, and saves to LocalDB before syncing to Firestore.
   */
  static async sendMessage(
    pairId: string,
    senderId: string,
    type: MessageType,
    payload: any,
    ratchet: RatchetState,
    replyTo?: string,
    ephemeralParams?: { isViewOnce?: boolean, expiresAt?: number }
  ): Promise<string | null> {
    try {
      // 1. Serialize payload to JSON string
      const payloadString = JSON.stringify(payload);

      // 2. Encrypt using Ratchet
      const encrypted = ratchet.encrypt(payloadString);

      // 3. Create envelope with a generated local ID
      const localId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const envelope: MessageEnvelope = {
        id: localId,
        pairId,
        senderId,
        type,
        ciphertext: encrypted.ciphertextBase64,
        nonce: encrypted.nonceBase64,
        status: 'sent',
        createdAt: Timestamp.now(), // Use local timestamp immediately
        dhPublicKey: encrypted.dhPubKey,
        messageNumber: encrypted.msgNum,
        previousChainLength: encrypted.prevChainLen,
        ...(ephemeralParams || {})
      };

      if (replyTo) {
        envelope.replyTo = replyTo;
      }

      // 4. Save to Local Database immediately (Optimistic UI update)
      LocalDatabase.saveMessage(envelope, payload, false); // isSynced = false
      LocalDatabase.queueOutgoingEnvelope(envelope);

      // 5. Attempt Background Sync to Firestore
      MessageService.syncPendingOutbox();

      return localId;
    } catch (error) {
      console.error('[MessageService] Error sending message:', error);
      return null;
    }
  }

  /**
   * Processes the outbox and syncs pending messages to Firestore
   */
  static async syncPendingOutbox() {
    const pending = LocalDatabase.getPendingEnvelopes();
    for (const item of pending) {
      try {
        const { id, envelope } = item;
        // Strip out any non-firestore fields if necessary, or push entire envelope
        const docRef = doc(firestore, 'messages', id);
        
        // We ensure createdAt is an actual Firebase server timestamp when it hits the DB
        const cloudEnvelope = {
          ...envelope,
          createdAt: serverTimestamp()
        };

        await setDoc(docRef, cloudEnvelope);
        
        // On success, mark as synced and remove from queue
        LocalDatabase.saveMessage({ ...envelope, status: 'sent' }, null, true); // Update isSynced
        LocalDatabase.removePendingEnvelope(id);
      } catch (error) {
        console.error('[MessageService] Failed to sync envelope:', error);
        // It stays in the pending queue to try again later
      }
    }
  }

  /**
   * Decrypts an incoming message envelope and deserializes the payload using the receiver's ratchet chain.
   */
  static decryptMessage(envelope: MessageEnvelope, ratchet: RatchetState): any | null {
    try {
      const decryptedString = ratchet.decrypt(
        envelope.ciphertext,
        envelope.nonce,
        envelope.dhPublicKey,
        envelope.messageNumber
      );

      if (!decryptedString) return null;

      // Parse JSON back to original payload
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('[MessageService] Error decrypting message:', error);
      return null;
    }
  }

  /**
   * Update message status (e.g. delivered or read)
   */
  static async updateMessageStatus(messageId: string, status: MessageStatus): Promise<void> {
    try {
      const msgRef = doc(firestore, 'messages', messageId);
      const updates: any = { status };
      
      if (status === 'delivered') {
        updates.deliveredAt = serverTimestamp();
      } else if (status === 'read') {
        updates.readAt = serverTimestamp();
      }
      
      await updateDoc(msgRef, updates);
    } catch (error) {
      console.error('[MessageService] Error updating status:', error);
    }
  }
}
