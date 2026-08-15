# ONE - Focused 1:1 Messaging App

[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000000?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Cryptography](https://img.shields.io/badge/Cryptography-TweetNaCl%20(Curve25519)-008B8B?style=for-the-badge&logo=shield)](https://tweetnacl.js.org)

**ONE** is an ultra-secure, distraction-free **End-to-End Encrypted (E2EE)** mobile messaging application built for talking to *the one person who matters most*. No group chats, no algorithmic feeds, no noise—just a direct, encrypted line to your most important connection.

Built with **React Native**, **Expo SDK 54**, **TypeScript**, and **Firebase**, ONE is designed for scale and is Play Store-ready. All communications—including text, compressed media, documents, and real-time geolocation—are encrypted locally on your device before transmission and can only be decrypted by your pair. 

---

## 🌟 Key Features

- **🔒 End-to-End Encryption (E2EE)**: Powered by Curve25519 (X25519) asymmetric keys and XSalsa20-Poly1305 authenticated symmetric encryption via TweetNaCl.
- **🤫 Zero Noise Architecture**: Specifically designed as a 1:1 messaging application. No groups, no status updates, no algorithmic feeds.
- **🔗 Simple & Secure Pairing**: Connect with your person via a secure invite code or QR code link.
- **📱 Phone Authentication**: Seamless and secure onboarding using Firebase Phone Authentication.
- **🖼️ Encrypted Attachments**: Share images, documents, contacts, locations, and calendar events securely. Binary files are encrypted locally before being uploaded to Firebase Storage.
- **🔔 Private Push Notifications**: Real-time push notifications powered by Expo and Firebase Cloud Functions. Notification payloads are intentionally generic to preserve privacy.
- **🟢 Online Status & Presence**: Real-time presence indicators via Firebase Realtime Database.
- **🔑 Secure Hardware Storage**: Private keys are generated on-device and stored strictly in OS-encrypted hardware keychains via `expo-secure-store`.
- **🛡️ Strict Zero-Trust Backend**: Firebase Firestore Security Rules explicitly forbid unencrypted plaintext fields, acting purely as a blind ciphertext relay.

---

## 🛡️ Cryptographic & Security Architecture

### 1. Key Generation & Exchange (ECDH)
- **Curve25519 (X25519)**: Each user auto-generates a key pair upon initial launch.
  - **Private Key**: Encrypted and stored locally using `expo-secure-store`.
  - **Public Key**: Uploaded to the public `users/{uid}` collection in Firestore.
- **Shared Key (ECDH)**: When a chat session begins, the client computes a 32-byte shared symmetric key using `nacl.box.before(peerPublicKey, mySecretKey)`. The shared key exists solely in transient RAM.

### 2. Payload Encryption Lifecycle
- **Nonce Generation**: A unique 24-byte random nonce is generated for every single message.
- **Authenticated Encryption**: Plaintext (or raw binary file buffers) is encrypted using `nacl.box.after(data, nonce, sharedKey)`.
- **Ciphertext Relay**: 
  - Text messages: Pushed directly to Firestore.
  - Large binary files (Images, Documents): Pushed to Firebase Storage; only the download URL, ciphertext, and nonce are pushed to Firestore.
- **On-Device Decryption**: Receiving clients listen to Firestore snapshots, extract ciphertext/nonce, and invoke `nacl.box.open.after`. If MAC verification succeeds, plaintext/binary is rendered locally.

---

## 📂 Architecture & Directory Structure

```
messaging-e2ee/
├── app/                           # Expo Router Screens (Navigation)
│   ├── (auth)/                    # Onboarding, Phone Login, Profile Setup
│   ├── (main)/                    # Core Chat UI, Settings
│   └── pair/                      # Invite Generation & Acceptance
├── docs/                          # Play Store Legal Documents (Privacy/ToS)
├── functions/                     # Firebase Cloud Functions (Push Notifications)
├── firestore.rules                # Strict Firestore Zero-Trust Security Rules
├── eas.json                       # EAS Build & release profiles
├── babel.config.js                # Babel path aliases and reanimated config
└── src/
    ├── components/
    │   └── chat/                  # Custom UI: MessageBubble, AttachmentSheet, ImageViewer
    ├── config/
    │   └── firebase.ts            # Firebase app & services initialization
    ├── services/
    │   ├── cryptoService.ts       # TweetNaCl primitives (text and binary encryption)
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
- Expo Go app or an Android/iOS Emulator

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

Start the Expo development server:

```bash
# Start Expo server
npm start

# Run on Android Emulator
npm run android

# Run on iOS Simulator
npm run ios
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

This application utilizes standard TweetNaCl algorithms for end-to-end encryption. Security guarantees rely on key secrecy: if a physical device is rooted or compromised, stored private keys in hardware storage may be exposed. Always protect your device with secure passcodes/biometrics.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
