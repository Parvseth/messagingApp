import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { rtdb } from '../config/firebase'; // Assume Realtime Database is initialized there

export class PresenceService {
  static setupPresence(uid: string) {
    if (!rtdb) return;

    const userStatusDatabaseRef = ref(rtdb, `/status/${uid}`);
    const connectedRef = ref(rtdb, '.info/connected');

    onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === false) {
        return;
      }

      onDisconnect(userStatusDatabaseRef)
        .set({
          state: 'offline',
          last_changed: serverTimestamp(),
        })
        .then(() => {
          set(userStatusDatabaseRef, {
            state: 'online',
            last_changed: serverTimestamp(),
          });
        });
    });
  }

  static subscribeToPeerPresence(peerUid: string, callback: (status: any) => void) {
    if (!rtdb) return () => {};

    const peerStatusRef = ref(rtdb, `/status/${peerUid}`);
    const unsubscribe = onValue(peerStatusRef, (snapshot) => {
      callback(snapshot.val());
    });

    return unsubscribe;
  }
}
