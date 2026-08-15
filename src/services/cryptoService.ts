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
}
