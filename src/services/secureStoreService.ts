import * as SecureStore from 'expo-secure-store';

const PRIVATE_KEY_PREFIX = 'e2ee_private_key_';

export class SecureStoreService {
  /**
   * Safely stores the user's private key in device encrypted storage.
   * The private key NEVER leaves the local device.
   *
   * @param uid Firebase Auth User ID
   * @param privateKeyBase64 Base64-encoded private key
   */
  static async savePrivateKey(uid: string, privateKeyBase64: string): Promise<void> {
    await SecureStore.setItemAsync(`${PRIVATE_KEY_PREFIX}${uid}`, privateKeyBase64, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  }

  /**
   * Retrieves the user's private key from device encrypted storage.
   *
   * @param uid Firebase Auth User ID
   * @returns Base64-encoded private key string or null if not found
   */
  static async getPrivateKey(uid: string): Promise<string | null> {
    return await SecureStore.getItemAsync(`${PRIVATE_KEY_PREFIX}${uid}`);
  }

  /**
   * Deletes private key from device storage (e.g., on logout or device wipe).
   */
  static async deletePrivateKey(uid: string): Promise<void> {
    await SecureStore.deleteItemAsync(`${PRIVATE_KEY_PREFIX}${uid}`);
  }
}
