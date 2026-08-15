import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

export interface KeyPairBase64 {
  publicKey: string;
  secretKey: string;
}

export interface EncryptedPayload {
  ciphertext: string;
  nonce: string;
}

export class CryptoService {
  /**
   * Generates a new Curve25519 (X25519) key pair for Diffie-Hellman box encryption.
   * Returns public and secret keys encoded as Base64 strings.
   */
  static generateKeyPair(): KeyPairBase64 {
    const keyPair = nacl.box.keyPair();
    return {
      publicKey: naclUtil.encodeBase64(keyPair.publicKey),
      secretKey: naclUtil.encodeBase64(keyPair.secretKey),
    };
  }

  /**
   * Computes a 32-byte shared symmetric key using Elliptic-Curve Diffie-Hellman (ECDH) via nacl.box.before.
   * The returned Uint8Array shared key can be stored in memory for the duration of the chat session.
   *
   * @param mySecretKeyBase64 Current user's private key (Base64 string)
   * @param peerPublicKeyBase64 Recipient's public key (Base64 string)
   */
  static computeSharedKey(mySecretKeyBase64: string, peerPublicKeyBase64: string): Uint8Array {
    const mySecretKey = naclUtil.decodeBase64(mySecretKeyBase64);
    const peerPublicKey = naclUtil.decodeBase64(peerPublicKeyBase64);
    return nacl.box.before(peerPublicKey, mySecretKey);
  }

  /**
   * Encrypts a UTF-8 plaintext message using the pre-computed shared symmetric key and a random 24-byte nonce.
   *
   * @param text The plaintext string to encrypt
   * @param sharedKey Pre-computed shared symmetric key from nacl.box.before
   */
  static encryptMessage(text: string, sharedKey: Uint8Array): EncryptedPayload {
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const messageBytes = naclUtil.decodeUTF8(text);
    const encryptedBytes = nacl.box.after(messageBytes, nonce, sharedKey);

    return {
      ciphertext: naclUtil.encodeBase64(encryptedBytes),
      nonce: naclUtil.encodeBase64(nonce),
    };
  }

  /**
   * Decrypts a Base64-encoded ciphertext payload using the nonce and pre-computed shared key.
   * Returns null if MAC verification fails or payload is invalid.
   *
   * @param ciphertextBase64 Base64-encoded encrypted bytes
   * @param nonceBase64 Base64-encoded 24-byte nonce
   * @param sharedKey Pre-computed shared symmetric key from nacl.box.before
   */
  static decryptMessage(
    ciphertextBase64: string,
    nonceBase64: string,
    sharedKey: Uint8Array
  ): string | null {
    try {
      const ciphertext = naclUtil.decodeBase64(ciphertextBase64);
      const nonce = naclUtil.decodeBase64(nonceBase64);
      const decryptedBytes = nacl.box.open.after(ciphertext, nonce, sharedKey);

      if (!decryptedBytes) {
        return null;
      }
      return naclUtil.encodeUTF8(decryptedBytes);
    } catch (error) {
      console.error('[CryptoService] Decryption failed:', error);
      return null;
    }
  }
  /**
   * Encrypts binary data using the pre-computed shared symmetric key and a random 24-byte nonce.
   */
  static encryptBinary(data: Uint8Array, sharedKey: Uint8Array): EncryptedPayload {
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const encryptedBytes = nacl.box.after(data, nonce, sharedKey);

    return {
      ciphertext: naclUtil.encodeBase64(encryptedBytes),
      nonce: naclUtil.encodeBase64(nonce),
    };
  }

  /**
   * Decrypts binary data returning Uint8Array.
   */
  static decryptBinary(
    ciphertextBase64: string,
    nonceBase64: string,
    sharedKey: Uint8Array
  ): Uint8Array | null {
    try {
      const ciphertext = naclUtil.decodeBase64(ciphertextBase64);
      const nonce = naclUtil.decodeBase64(nonceBase64);
      const decryptedBytes = nacl.box.open.after(ciphertext, nonce, sharedKey);

      return decryptedBytes || null;
    } catch (error) {
      console.error('[CryptoService] Binary decryption failed:', error);
      return null;
    }
  }
  /**
   * KDF using nacl.auth (HMAC-SHA-512-256).
   * Generates a 32-byte pseudo-random key from key and input data.
   */
  static kdf(key: Uint8Array, input: Uint8Array): Uint8Array {
    return nacl.auth(input, key);
  }

  /**
   * Generates next Chain Key and Message Key from a current Chain Key.
   */
  static advanceSymmetricRatchet(chainKey: Uint8Array): { nextChainKey: Uint8Array, messageKey: Uint8Array } {
    // Input 1 for Message Key, 2 for Next Chain Key
    const messageInput = new Uint8Array([0x01]);
    const nextChainInput = new Uint8Array([0x02]);

    const messageKey = this.kdf(chainKey, messageInput);
    const nextChainKey = this.kdf(chainKey, nextChainInput);

    return { nextChainKey, messageKey };
  }

  /**
   * Root Ratchet step: Generates new Root Key and new Chain Key from a DH exchange.
   */
  static advanceRootRatchet(rootKey: Uint8Array, dhOutput: Uint8Array): { nextRootKey: Uint8Array, nextChainKey: Uint8Array } {
    // HKDF-like construction
    const kdfOutput1 = this.kdf(rootKey, dhOutput);
    const nextRootKey = this.kdf(kdfOutput1, new Uint8Array([0x01]));
    const nextChainKey = this.kdf(kdfOutput1, new Uint8Array([0x02]));

    return { nextRootKey, nextChainKey };
  }
}

/**
 * State for a Double Ratchet session
 */
export class RatchetState {
  rootKey: Uint8Array;
  
  // DH Ratchet
  dhKeyPair: KeyPairBase64;
  remoteDhPublicKeyBase64: string | null;

  // Symmetric Ratchets
  sendChainKey: Uint8Array | null = null;
  receiveChainKey: Uint8Array | null = null;

  sendCount: number = 0;
  receiveCount: number = 0;
  previousSendCount: number = 0; // PN

  // Store skipped message keys for out-of-order delivery
  skippedMessageKeys: Record<string, Uint8Array> = {}; // key: "dhPubKey_msgNum"

  constructor(sharedSecret: Uint8Array, isInitiator: boolean, initialRemotePubKey?: string) {
    this.rootKey = sharedSecret;
    this.dhKeyPair = CryptoService.generateKeyPair();
    
    if (isInitiator) {
      this.remoteDhPublicKeyBase64 = initialRemotePubKey!;
      // Initialize send chain via DH
      const dhOutput = CryptoService.computeSharedKey(this.dhKeyPair.secretKey, this.remoteDhPublicKeyBase64);
      const { nextRootKey, nextChainKey } = CryptoService.advanceRootRatchet(this.rootKey, dhOutput);
      this.rootKey = nextRootKey;
      this.sendChainKey = nextChainKey;
    } else {
      this.remoteDhPublicKeyBase64 = null;
    }
  }

  /**
   * Encrypt a payload using the Send Chain
   */
  encrypt(plaintext: string): { ciphertextBase64: string, nonceBase64: string, dhPubKey: string, msgNum: number, prevChainLen: number } {
    if (!this.sendChainKey) throw new Error("Send chain not initialized");

    const { nextChainKey, messageKey } = CryptoService.advanceSymmetricRatchet(this.sendChainKey);
    this.sendChainKey = nextChainKey;

    const payload = CryptoService.encryptMessage(plaintext, messageKey);
    const result = {
      ciphertextBase64: payload.ciphertext,
      nonceBase64: payload.nonce,
      dhPubKey: this.dhKeyPair.publicKey,
      msgNum: this.sendCount,
      prevChainLen: this.previousSendCount
    };

    this.sendCount++;
    return result;
  }

  /**
   * Decrypt a payload using the Receive Chain
   */
  decrypt(ciphertextBase64: string, nonceBase64: string, dhPubKey: string, msgNum: number): string | null {
    // 1. Check skipped keys
    const mkKey = `${dhPubKey}_${msgNum}`;
    if (this.skippedMessageKeys[mkKey]) {
      const messageKey = this.skippedMessageKeys[mkKey];
      delete this.skippedMessageKeys[mkKey];
      return CryptoService.decryptMessage(ciphertextBase64, nonceBase64, messageKey);
    }

    // 2. Is this a new DH ratchet step?
    if (dhPubKey !== this.remoteDhPublicKeyBase64) {
      this.previousSendCount = this.sendCount;
      this.remoteDhPublicKeyBase64 = dhPubKey;
      
      // Compute Receive Chain
      let dhOutput = CryptoService.computeSharedKey(this.dhKeyPair.secretKey, this.remoteDhPublicKeyBase64);
      let roots = CryptoService.advanceRootRatchet(this.rootKey, dhOutput);
      this.rootKey = roots.nextRootKey;
      this.receiveChainKey = roots.nextChainKey;

      // Generate a new DH pair and compute new Send Chain
      this.dhKeyPair = CryptoService.generateKeyPair();
      dhOutput = CryptoService.computeSharedKey(this.dhKeyPair.secretKey, this.remoteDhPublicKeyBase64);
      roots = CryptoService.advanceRootRatchet(this.rootKey, dhOutput);
      this.rootKey = roots.nextRootKey;
      this.sendChainKey = roots.nextChainKey;

      this.receiveCount = 0;
      this.sendCount = 0;
    }

    // 3. Skip missing messages in current chain
    while (this.receiveCount < msgNum) {
      if (!this.receiveChainKey) throw new Error("Receive chain missing");
      const { nextChainKey, messageKey } = CryptoService.advanceSymmetricRatchet(this.receiveChainKey);
      this.receiveChainKey = nextChainKey;
      this.skippedMessageKeys[`${dhPubKey}_${this.receiveCount}`] = messageKey;
      this.receiveCount++;
    }

    // 4. Decrypt current message
    if (!this.receiveChainKey) throw new Error("Receive chain missing");
    const { nextChainKey, messageKey } = CryptoService.advanceSymmetricRatchet(this.receiveChainKey);
    this.receiveChainKey = nextChainKey;
    this.receiveCount++;

    return CryptoService.decryptMessage(ciphertextBase64, nonceBase64, messageKey);
  }
}
