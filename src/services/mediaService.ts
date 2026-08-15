import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { CryptoService } from './cryptoService';
import { MediaPayload } from '../types/message';

export class MediaService {
  static async pickAndEncryptImage(sharedKey: Uint8Array): Promise<MediaPayload | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.3,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      const imageUri = asset.uri;
      
      // Read binary
      const base64Data = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      // Encrypt binary
      const encryptedPayload = CryptoService.encryptBinary(binaryData, sharedKey);
      
      // Generate a unique filename
      const fileName = `media_${Date.now()}.enc`;
      const storageRef = ref(storage, `media/${fileName}`);

      // We upload the JSON containing ciphertext and nonce
      const blob = new Blob([JSON.stringify(encryptedPayload)], { type: 'application/json' });
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);

      return {
        storageUrl: downloadUrl,
        mimeType: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || 'image.jpg',
        fileSize: asset.fileSize,
      };
    } catch (error) {
      console.error('[MediaService] Error picking and encrypting image:', error);
      return null;
    }
  }

  static async downloadAndDecryptImage(payload: MediaPayload, sharedKey: Uint8Array): Promise<string | null> {
    if (!payload.storageUrl) return null;
    try {
      const response = await fetch(payload.storageUrl);
      const encryptedPayload = await response.json();
      
      const decryptedBytes = CryptoService.decryptBinary(
        encryptedPayload.ciphertext,
        encryptedPayload.nonce,
        sharedKey
      );

      if (!decryptedBytes) return null;

      // Convert back to base64
      let binary = '';
      decryptedBytes.forEach(b => binary += String.fromCharCode(b));
      const base64Data = btoa(binary);

      const localImagePath = FileSystem.cacheDirectory + `decrypted_${Date.now()}.jpg`;
      
      await FileSystem.writeAsStringAsync(localImagePath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return localImagePath;
    } catch (error) {
      console.error('[MediaService] Error downloading and decrypting image:', error);
      return null;
    }
  }
}
