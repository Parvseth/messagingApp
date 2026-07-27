import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { CryptoService, EncryptedPayload } from './cryptoService';

export class MediaService {
  /**
   * Prompts the user to pick an image, compresses it heavily, reads it as Base64,
   * encrypts it using TweetNaCl, and returns the encrypted payload to store in Firestore.
   */
  static async pickAndEncryptImage(sharedKey: Uint8Array): Promise<EncryptedPayload | null> {
    try {
      // 1. Pick and compress the image heavily to stay well below Firestore 1MB limit
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, 
        quality: 0.1, // Super heavy compression for inline database storage
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const imageUri = result.assets[0].uri;

      // 2. Read the image as a Base64 string
      const base64Data = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      // Prefix with data URI scheme
      const dataUri = `data:image/jpeg;base64,${base64Data}`;

      // 3. Encrypt the Data URI string directly
      const encryptedPayload: EncryptedPayload = CryptoService.encryptMessage(dataUri, sharedKey);

      // Return the ciphertext to be saved directly in the Firestore message!
      return encryptedPayload;
    } catch (error) {
      console.error('[MediaService] Error picking and encrypting image:', error);
      return null;
    }
  }

  /**
   * Saves a decrypted Data URI to a temporary file and returns the file path.
   */
  static async saveDecryptedImageToTempFile(dataUri: string): Promise<string | null> {
    try {
      const base64Data = dataUri.replace(/^data:image\/\w+;base64,/, '');
      const localImagePath = FileSystem.cacheDirectory + `decrypted_${Math.random().toString(36).substring(7)}.jpg`;
      
      await FileSystem.writeAsStringAsync(localImagePath, base64Data, {
        encoding: 'base64',
      });

      return localImagePath;
    } catch (error) {
      console.error('[MediaService] Error saving image to temp file:', error);
      return null;
    }
  }
}
