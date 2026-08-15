import { Timestamp } from 'firebase/firestore';

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'contact' | 'location' | 'event';

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read';

export interface MessageEnvelope {
  id?: string;
  pairId: string;
  senderId: string;
  type: MessageType;
  ciphertext: string;      // Encrypted payload
  nonce: string;           // 24-byte random nonce
  status: MessageStatus;
  
  // Double Ratchet specific fields
  dhPublicKey: string;     // Sender's current ECDH public key (Base64)
  messageNumber: number;   // Index in the current sending chain
  previousChainLength: number; // For handling out-of-order messages
  
  // Ephemeral fields
  isViewOnce?: boolean;
  expiresAt?: number;      // Unix timestamp for TTL messages
  
  replyTo?: string;        // Message ID for reply threading
  createdAt: Timestamp | any;    // serverTimestamp or Date depending on local vs remote
  deliveredAt?: Timestamp;
  readAt?: Timestamp;
}

// These are the decrypted payloads for different types

export interface TextPayload {
  text: string;
}

export interface MediaPayload {
  uri?: string; // Local URI
  storageUrl?: string; // Remote URL
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
}

export interface LocationPayload {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface ContactPayload {
  vCard: string;
  name?: string;
}

export interface EventPayload {
  title: string;
  date: string; // ISO string
  location?: string;
  description?: string;
}
