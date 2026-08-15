import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { CryptoService } from './cryptoService';
import { MessageEnvelope, MessageType, MessageStatus } from '../types/message';

export class MessageService {
  /**
   * Serializes a payload to string, encrypts it, and sends it to Firestore.
   */
  static async sendMessage(
    pairId: string,
    senderId: string,
    type: MessageType,
    payload: any,
    sharedKey: Uint8Array,
    replyTo?: string
  ): Promise<string | null> {
    try {
      // 1. Serialize payload to JSON string
      const payloadString = JSON.stringify(payload);

      // 2. Encrypt
      const encrypted = CryptoService.encryptMessage(payloadString, sharedKey);

      // 3. Create envelope
      const envelope: MessageEnvelope = {
        pairId,
        senderId,
        type,
        ciphertext: encrypted.ciphertext,
        nonce: encrypted.nonce,
        status: 'sent',
        createdAt: serverTimestamp(),
      };

      if (replyTo) {
        envelope.replyTo = replyTo;
      }

      // 4. Send to Firestore
      const docRef = await addDoc(collection(firestore, 'messages'), envelope);
      return docRef.id;
    } catch (error) {
      console.error('[MessageService] Error sending message:', error);
      return null;
    }
  }

  /**
   * Decrypts an incoming message envelope and deserializes the payload.
   */
  static decryptMessage(envelope: MessageEnvelope, sharedKey: Uint8Array): any | null {
    try {
      const decryptedString = CryptoService.decryptMessage(
        envelope.ciphertext,
        envelope.nonce,
        sharedKey
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
