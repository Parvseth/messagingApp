import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { CryptoService } from './cryptoService';
import { MediaPayload } from '../types/message';

export class DocumentService {
  static async pickAndEncryptDocument(sharedKey: Uint8Array): Promise<MediaPayload | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      const fileUri = asset.uri;

      // Read binary
      const base64Data = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      // Encrypt binary
      const encryptedPayload = CryptoService.encryptBinary(binaryData, sharedKey);
      
      // Generate a unique filename
      const fileName = `doc_${Date.now()}.enc`;
      const storageRef = ref(storage, `documents/${fileName}`);

      // We upload the JSON containing ciphertext and nonce
      const blob = new Blob([JSON.stringify(encryptedPayload)], { type: 'application/json' });
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);

      return {
        storageUrl: downloadUrl,
        mimeType: asset.mimeType || 'application/octet-stream',
        fileName: asset.name || 'document.file',
        fileSize: asset.size,
      };
    } catch (error) {
      console.error('[DocumentService] Error picking and encrypting document:', error);
      return null;
    }
  }
}
