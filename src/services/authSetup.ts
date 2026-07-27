import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { CryptoService } from './cryptoService';
import { SecureStoreService } from './secureStoreService';

export interface UserProfile {
  uid: string;
  email: string;
  publicKey: string;
  createdAt: any;
}

/**
 * Ensures the authenticated user has an E2EE key pair.
 * Checks local SecureStore for Private Key and Firestore for Public Key.
 * If missing, generates a new Curve25519 keypair, stores private key locally, and pushes public key to Firestore.
 *
 * @param uid Current Firebase Auth UID
 * @param email Current user email address
 * @returns Promise resolving to the Base64 private key string
 */
export async function syncUserKeys(uid: string, email: string): Promise<string> {
  // 1. Attempt to fetch private key from device SecureStore
  let privateKey = await SecureStoreService.getPrivateKey(uid);
  const userDocRef = doc(firestore, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);

  if (!privateKey || !userDocSnap.exists()) {
    // Generate new key pair
    const keyPair = CryptoService.generateKeyPair();
    privateKey = keyPair.secretKey;

    // Save Private Key locally ONLY in device secure store
    await SecureStoreService.savePrivateKey(uid, privateKey);

    // Save Public Key to Firestore users collection
    await setDoc(
      userDocRef,
      {
        uid,
        email,
        publicKey: keyPair.publicKey,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  return privateKey;
}

/**
 * Fetches the peer user's Base64 Public Key from the Firestore users collection.
 *
 * @param peerUid Recipient Firebase Auth UID
 * @returns Base64 public key or null if peer has not registered a public key yet
 */
export async function fetchPeerPublicKey(peerUid: string): Promise<string | null> {
  const peerDocRef = doc(firestore, 'users', peerUid);
  const peerSnap = await getDoc(peerDocRef);

  if (peerSnap.exists()) {
    const data = peerSnap.data() as UserProfile;
    return data.publicKey || null;
  }
  
  return null;
}
