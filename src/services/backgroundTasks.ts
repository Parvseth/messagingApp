import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { CryptoService, RatchetState } from './cryptoService';
import { MessageService } from './messageService';
import { LocalDatabase } from './localDatabase';
import { MessageEnvelope } from '../types/message';
import * as SecureStore from 'expo-secure-store';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error, executionInfo }) => {
  if (error) {
    console.error('[BackgroundTask] Error:', error);
    return;
  }
  
  if (data) {
    const { notification } = data as any;
    const payload = notification?.data;
    
    if (payload?.type === 'NEW_MESSAGE' && payload.messageId) {
      try {
        console.log('[BackgroundTask] Waking up to decrypt message:', payload.messageId);
        
        // 1. Fetch Ciphertext from Firestore
        const msgDoc = await getDoc(doc(firestore, 'messages', payload.messageId));
        if (!msgDoc.exists()) return;
        
        const envelope = { id: msgDoc.id, ...msgDoc.data() } as MessageEnvelope;

        // 2. We need the local Ratchet State. 
        // In a real app, you would retrieve the persisted RatchetState string from MMKV/SecureStore
        // and re-instantiate it here. Since our MVP mocks RatchetState in index.tsx, we will 
        // simulate a background local notification to prove the concept.
        
        // Mocking the Ratchet State retrieval for the background task
        const sharedSecret = new Uint8Array(32); 
        const ratchet = new CryptoService.RatchetState(sharedSecret, false, new Uint8Array(32)); 
        
        const decrypted = MessageService.decryptMessage(envelope, ratchet);
        
        if (decrypted) {
          // Save to Local SQLite DB while offline/in background
          LocalDatabase.saveMessage(envelope, decrypted, true);
          
          // Fire a Local OS Notification with the plaintext
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "YOUR PERSON",
              body: decrypted.text || "Sent an attachment",
              data: { pairId: envelope.pairId },
            },
            trigger: null, // Send immediately
          });
        }
      } catch (err) {
        console.error('[BackgroundTask] Decryption failed:', err);
      }
    }
  }
});

// Register background fetch for push notifications
export const registerBackgroundTasks = () => {
  Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
};
