# 🔒 E2EE Messaging App

[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000000?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Cryptography](https://img.shields.io/badge/Cryptography-TweetNaCl%20(Curve25519)-008B8B?style=for-the-badge&logo=shield)](https://tweetnacl.js.org)

A ultra-secure, hyper-private **End-to-End Encrypted (E2EE)** mobile messaging application built with **React Native**, **Expo SDK 54**, **TypeScript**, and **Firebase Firestore**.

All communications—including text messages, compressed media files, and live geolocation data—are encrypted locally on the sender's device before transmission and can only be decrypted on the intended recipient's device. The backend database acts purely as a blind ciphertext relay.

---

## 🌟 Key Features

- **🔐 End-to-End Encryption (E2EE)**: Powered by Curve25519 (X25519) asymmetric keys and XSalsa20-Poly1305 authenticated symmetric encryption via TweetNaCl.
- **📱 Anti-Screen Capture Protection**: OS-level screenshot and screen recording blocking via `expo-screen-capture`.
- **🔑 Secure Hardware Storage**: Private keys are generated on-device and stored strictly in hardware/OS encrypted keychains via `expo-secure-store`. Private keys never leave the physical device.
- **🖼️ Encrypted Media Sharing**: Pick, compress, encrypt, and transmit inline image payloads directly through E2EE channels, with options to save decrypted images to the local photo library or share to external apps securely.
- **📍 Encrypted Location Sharing**: Real-time geolocation coordinates encrypted with TweetNaCl and rendered in an interactive embedded `react-native-maps` interface.
- **🛡️ Strict Zero-Trust Backend**: Firestore Security Rules strictly forbid any unencrypted plaintext fields from entering the database.
- **🎨 Dark Minimalist Security UI**: Sleek, distraction-free dark visual aesthetic custom tailored for high-security messaging.

---

## 🛡️ Cryptographic & Security Architecture

### 1. Key Generation & Exchange (ECDH)
- **Curve25519 (X25519)**: Each user auto-generates a key pair upon initial launch.
  - **Private Key**: Encrypted and stored locally using `expo-secure-store` with `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`.
  - **Public Key**: Uploaded to the public `users/{uid}` collection in Firestore.
- **Elliptic-Curve Diffie-Hellman (ECDH)**: When a chat session begins, the client computes a 32-byte shared symmetric key using `nacl.box.before(peerPublicKey, mySecretKey)`. The shared key exists solely in transient RAM memory.

### 2. Message Encryption & Decryption Lifecycle
- **Nonce Generation**: A unique 24-byte cryptographically secure random nonce is generated for every single message (`nacl.randomBytes`).
- **Authenticated Encryption**: Plaintext (text, base64 media, or geo-coordinates) is encrypted using `nacl.box.after(messageBytes, nonce, sharedKey)`.
- **Ciphertext Relay**: Only `ciphertext`, `nonce`, `senderId`, `receiverId`, and `createdAt` are pushed to Firestore.
- **On-Device Decryption**: Receiving clients listen to Firestore snapshots, extract ciphertext and nonce, and invoke `nacl.box.open.after` using the shared key. If MAC verification succeeds, plaintext is rendered locally.

```
       [ Alice's Device ]                                    [ Bob's Device ]
+-------------------------------+                    +-------------------------------+
| 1. Generate X25519 Key Pair   |                    | 1. Generate X25519 Key Pair   |
|    - Private Key -> SecureStore|                    |    - Private Key -> SecureStore|
|    - Public Key  -> Firestore |                    |    - Public Key  -> Firestore |
+---------------+---------------+                    +---------------+---------------+
                |                                                    |
                |====== Fetch Bob's Public Key from Firestore =======|
                |====== Fetch Alice's Public Key from Firestore =====|
                v                                                    v
+-------------------------------+                    +-------------------------------+
| 2. Compute Shared Key (ECDH)  |                    | 2. Compute Shared Key (ECDH)  |
|    nacl.box.before()          |                    |    nacl.box.before()          |
+---------------+---------------+                    +---------------+---------------+
                |                                                    ^
   [ Plaintext Message / Image ]                                     |
                |                                                    |
                v                                                    |
+-------------------------------+                                    |
| 3. Encrypt (XSalsa20-Poly1305)|                                    |
|    nacl.box.after(msg, nonce) |                                    |
+---------------+---------------+                                    |
                |                                                    |
                v [ Encrypted Ciphertext + Nonce ]                   |
    +-----------------------+                                        |
    |  Firebase Firestore   | ---------------------------------------+
    |  (Blind Relay Server) |        [ Ciphertext Stream ]
    +-----------------------+
```

---

## 🔒 Security Protections & Database Rules

### OS Screen Capture Prevention
Screen capture is programmatically disabled on app startup to prevent user conversation leaks via screenshots or background video recorders:
```typescript
import * as ScreenCapture from 'expo-screen-capture';

useEffect(() => {
  ScreenCapture.preventScreenCaptureAsync();
}, []);
```

### Firestore Security Rules
Firestore rules mathematically enforce that non-encrypted payload structures are rejected server-side:
```javascript
match /messages/{messageId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null
    && request.resource.data.senderId == request.auth.uid
    && request.resource.data.keys().hasAll(['ciphertext', 'nonce', 'senderId', 'receiverId', 'createdAt'])
    && !request.resource.data.keys().hasAny(['text', 'message', 'plaintext']);
  allow update, delete: if false;
}
```

---

## 📂 Directory & File Structure

```
messaging-e2ee/
├── App.tsx                        # Main entry point & Identity authentication selector
├── app.json                       # Expo configuration & EAS metadata
├── eas.json                       # EAS Build & release profiles
├── firestore.rules                # Strict Firestore Zero-Trust Security Rules
├── storage.rules                  # Firebase Storage access security rules
├── metro.config.js                # Metro bundler configuration
├── package.json                   # Dependencies & build scripts
├── tsconfig.json                  # TypeScript compiler rules
└── src/
    ├── components/
    │   └── ChatScreen.tsx         # Real-time encrypted chat screen & GiftedChat integration
    ├── config/
    │   └── firebase.ts            # Firebase app initialization & Auth/Firestore exports
    └── services/
        ├── authSetup.ts           # Automatic key syncing & peer public key lookup
        ├── cryptoService.ts       # TweetNaCl cryptographic primitives wrapper
        ├── mediaService.ts        # Image picker, heavy compression, and encryption handler
        └── secureStoreService.ts  # Hardware keychain encrypted storage layer
```

---

## 🛠️ Technology Stack

| Domain | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Framework** | Expo SDK 54 / React Native 0.81 | Cross-platform mobile foundation |
| **Language** | TypeScript 5.9 | Type-safe application development |
| **Cryptographic Engine** | TweetNaCl & TweetNaCl-Util | Curve25519, XSalsa20-Poly1305 implementation |
| **Key Storage** | `expo-secure-store` | OS hardware-backed keychain storage |
| **Screen Protection** | `expo-screen-capture` | Blocks OS screenshotting/screen recording |
| **Backend & Relay** | Firebase Auth & Firestore | Real-time encrypted payload syncing |
| **UI Components** | `react-native-gifted-chat` | Chat interface & messaging bubbles |
| **Maps & Geo** | `react-native-maps` & `expo-location` | Encrypted location capture & map rendering |
| **Media Operations** | `expo-image-picker` & `expo-media-library` | Image capture, compression, & gallery management |
| **Sharing** | `expo-sharing` & `expo-file-system` | File system caching & native share dialogs |

---

## ⚙️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go app](https://expo.dev/go) or Android/iOS Emulator / Physical Device
- Firebase Project with Auth and Firestore enabled

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

3. **Configure Firebase**:
   Update `src/config/firebase.ts` with your Firebase project keys:
   ```typescript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

4. **Deploy Security Rules**:
   Publish `firestore.rules` and `storage.rules` to your Firebase Console to ensure unencrypted payloads are rejected.

---

## 🚀 Running the App

Start the Expo development server:

```bash
# Start Expo development server
npm start

# Run on Android target
npm run android

# Run on iOS target
npm run ios
```

---

## 📦 Building Standalone APK / App Bundle

This project is pre-configured with **EAS Build** (`eas.json`). To generate a standalone Android APK:

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Log in to Expo:
   ```bash
   eas login
   ```

3. Build Android Preview APK:
   ```bash
   eas build --platform android --profile preview
   ```

---

## ⚖️ Security Disclaimer

This application utilizes standard TweetNaCl algorithms for end-to-end encryption. Security guarantees rely on key secrecy: if a physical device is rooted or compromised, stored private keys in hardware storage may be exposed. Always protect your device with secure passcodes/biometrics.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
