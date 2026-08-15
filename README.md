# ONE - Focused 1:1 Messaging App

[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000000?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Cryptography](https://img.shields.io/badge/Cryptography-TweetNaCl%20(Curve25519)-008B8B?style=for-the-badge&logo=shield)](https://tweetnacl.js.org)

**ONE** is an ultra-secure, distraction-free **End-to-End Encrypted (E2EE)** mobile messaging application built for talking to *the one person who matters most*. No group chats, no algorithmic feeds, no noise—just a direct, encrypted line to your most important connection.

Built with **React Native**, **Expo SDK 54**, **TypeScript**, and **Firebase**, ONE is designed for scale and is Play Store-ready. All communications—including text, compressed media, documents, and real-time geolocation—are encrypted locally on your device before transmission and can only be decrypted by your pair. 

---

## 🌟 Key Features (Relationship OS)

- **🔒 Perfect Forward Secrecy (PFS)**: True Double Ratchet Algorithm implemented on top of TweetNaCl. Every single message receives a newly derived, unique symmetric key using KDF chains (Root, Sending, Receiving) and asynchronous Diffie-Hellman ratcheting.
- **🤫 Zero Noise Architecture**: Specifically designed as a 1:1 messaging application. No groups, no status updates, no algorithmic feeds.
- **📹 E2EE P2P Audio & Video Calls**: High-definition peer-to-peer 1:1 WebRTC calling. Media streams are End-to-End Encrypted via DTLS/SRTP natively, with Firebase Firestore acting strictly as a zero-trust Signaling Server for SDP/ICE exchanges.
- **⚡ High-Performance Architecture**: Chat UI is fully optimized to render thousands of message nodes at a buttery smooth 60fps utilizing Shopify's `FlashList` for intelligent view recycling.
- **💾 Offline-First & Background Sync**: Messages are instantly saved to a local SQLite database and queued for sync. `expo-task-manager` wakes the app via silent data-only push notifications to decrypt incoming messages natively in the background.
- **🔐 The Shared Vault**: A dedicated collaborative space containing a Shared Photo Gallery and a Real-time To-Do List.
- **🎯 Attention Management**: Set "Batched Notifications" to only receive alerts at specific times of the day (e.g. 9AM, 1PM, 6PM). 
- **🚨 Emergency Override Ping**: Bypass your partner's notification batches with a high-priority ping when it truly matters.
- **⏳ Time Capsule Messages**: Send messages that are cryptographically locked until a specific future date and time.
- **💣 Ephemeral Messaging**: Send self-destructing "View Once" messages or set Time-to-Live (TTL) auto-delete timers. Once consumed, the local payload is securely scrubbed and permanently deleted from the cloud.
- **🛡️ Biometric Fallback Lock**: Hardware-backed App Lock enforces FaceID or TouchID before launching or resuming the app, preventing physical access compromises.
- **🔑 Secure Hardware Storage**: Long-term private identity keys are generated on-device and stored strictly in OS-encrypted hardware keychains via `expo-secure-store`.

---

## 🛡️ Advanced Cryptographic Architecture

### 1. The Double Ratchet Algorithm
Unlike basic static ECDH configurations, ONE implements a complete custom Signal-style **Double Ratchet**:
- **Root Chain**: Advances via an Asymmetric Diffie-Hellman (DH) exchange every time the messaging direction switches. Derives the next Root Key and the initial Chain Key.
- **Symmetric Ratchets**: Sending and Receiving chains utilize HMAC-SHA-512-256 (KDF) to cryptographically roll a new message key and the next chain key for *every single message*.
- **Post-Compromise Security**: Even if a device is compromised today, the attacker cannot decrypt past messages (Forward Secrecy), nor future messages once a new DH ratchet step occurs (Future Secrecy).

### 2. Payload Encryption & Ephemeral Lifecycle
- **Authenticated Encryption**: Plaintext (or raw binary file buffers) is encrypted using `nacl.box.after(data, nonce, messageKey)`.
- **Ciphertext Relay**: Text ciphertext and attachment references are pushed to Firestore/Firebase Storage.
- **Out-of-Order Delivery**: Skipped message keys are securely temporarily stored by the receiving client to allow reliable decryption in adverse network conditions.
- **Cryptographic Scrubbing**: For ephemeral "View Once" media, memory buffers holding the decrypted `Uint8Array` keys are aggressively de-allocated after consumption, and the corresponding document is hard-deleted from the database.

---

## 📂 Architecture & Directory Structure

```
messaging-e2ee/
├── app/                           # Expo Router Screens (Navigation)
│   ├── (auth)/                    # Onboarding, Phone Login, Profile Setup
│   ├── (main)/                    # Core Chat UI, Settings, Vault (vault.tsx)
│   └── pair/                      # Invite Generation & Acceptance
├── docs/                          # Play Store Legal Documents (Privacy/ToS)
├── functions/                     # Firebase Cloud Functions (Push Notifications)
├── firestore.rules                # Strict Firestore Zero-Trust Security Rules
├── eas.json                       # EAS Build & release profiles
├── app.json                       # App config, permissions, and Expo Config Plugins
├── babel.config.js                # Babel path aliases and reanimated config
└── src/
    ├── components/
    │   ├── BiometricLock.tsx      # Root-level FaceID/TouchID security wrapper
    │   └── chat/                  # Custom UI: MessageBubble, AttachmentSheet, CallScreen
    ├── config/
    │   └── firebase.ts            # Firebase app & services initialization
    ├── services/
    │   ├── cryptoService.ts       # Double Ratchet state manager & TweetNaCl primitives
    │   ├── localDatabase.ts       # SQLite offline-first database wrapper
    │   ├── backgroundTasks.ts     # expo-task-manager logic for silent push decryption
    │   ├── webrtcService.ts       # P2P WebRTC connection & signaling logic
    │   ├── messageService.ts      # Unified message sending/receiving
    │   ├── mediaService.ts        # Image capture, compression, and encryption
    │   ├── documentService.ts     # Document picking and encryption
    │   ├── notificationService.ts # Expo push tokens
    │   └── presenceService.ts     # Realtime Database presence tracking
    └── types/
        └── message.ts             # Strict TypeScript definitions for message envelopes
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- Firebase Project (with Auth, Firestore, Storage, and Realtime Database enabled)
- Android Studio / Xcode for compiling Native Modules
- **NOTE**: Because this app uses custom native modules (WebRTC, SQLite, Task Manager), it **WILL NOT WORK in Expo Go**. You must use an Expo Development Build.

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Parvseth/messagingApp.git
   cd messagingApp
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your Firebase credentials:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Deploy Backend Rules & Functions**:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   cd functions && npm install && npm run deploy
   ```

---

## 🚀 Running the App

Start an Expo Development Build to compile the native modules:

```bash
# Compile and run on Android Emulator/Device
npx expo run:android

# Compile and run on iOS Simulator/Device
npx expo run:ios
```

---

## 📦 Building for the Play Store

This project is pre-configured with **EAS Build** for Play Store deployment.

1. Log in to Expo:
   ```bash
   eas login
   ```

2. Build the Production App Bundle (AAB):
   ```bash
   eas build --platform android --profile production
   ```

3. **Play Store Compliance**: See the `docs/` folder for pre-written Privacy Policy and Terms of Service documents required for Data Safety declarations on Google Play Console.

---

## ⚖️ Security Disclaimer

This application utilizes the Double Ratchet Algorithm, KDF chains, and TweetNaCl primitives for state-of-the-art end-to-end encryption. Security guarantees rely on key secrecy and cryptographic memory scrubbing. While ephemeral payloads are immediately wiped from memory, if a physical device is fundamentally rooted or compromised, stored private keys in hardware storage could theoretically be exposed. Always protect your device with secure passcodes and leverage the included biometric app lock.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
