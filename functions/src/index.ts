import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// When a new message is created, send a push notification to the recipient
export const onMessageCreate = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data) return;

    const { pairId, senderId, type } = data;

    // Get the pair document to find the receiver
    const pairDoc = await db.collection('pairs').doc(pairId).get();
    if (!pairDoc.exists) return;

    const pairData = pairDoc.data();
    if (!pairData || !pairData.participants) return;

    // The recipient is the other participant
    const recipientId = pairData.participants.find((uid: string) => uid !== senderId);
    if (!recipientId) return;

    // Get the recipient's push token
    const userDoc = await db.collection('users').doc(recipientId).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data();
    const pushToken = userData?.pushToken;
    
    if (!pushToken) {
      console.log(`No push token for user ${recipientId}`);
      return;
    }

    // Determine notification body based on message type
    let body = 'Sent you a message';
    switch (type) {
      case 'image': body = 'Sent you an image'; break;
      case 'document': body = 'Sent you a document'; break;
      case 'location': body = 'Shared a location'; break;
      case 'contact': body = 'Shared a contact'; break;
      case 'event': body = 'Invited you to an event'; break;
      default: body = 'Sent you an encrypted message'; // Text is encrypted, so we can't show it!
    }

    // Send push notification via Expo
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: pushToken,
          sound: 'default',
          title: 'ONE', // Hide sender name for maximum privacy, or fetch it if needed
          body: body,
          data: { pairId }, // Data for deep linking
        }),
      });
      
      console.log('Push notification response:', await response.json());
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  });
