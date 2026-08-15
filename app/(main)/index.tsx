import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import BottomSheet from '@gorhom/bottom-sheet';
import { MessageEnvelope } from '../../src/types/message';
import { MessageBubble } from '../../src/components/chat/MessageBubble';
import { AttachmentSheet } from '../../src/components/chat/AttachmentSheet';
import { ImageViewer } from '../../src/components/chat/ImageViewer';
import { MessageService } from '../../src/services/messageService';
import { CryptoService } from '../../src/services/cryptoService';
import { MediaService } from '../../src/services/mediaService';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../src/config/firebase';

export default function ChatScreen() {
  const [messages, setMessages] = useState<(MessageEnvelope & { decrypted?: any })[]>([]);
  const [text, setText] = useState('');
  const [sharedKey, setSharedKey] = useState<Uint8Array | null>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  // MOCK: In reality, we'd get this from Zustand/Auth context
  const currentUid = 'user1';
  const peerUid = 'user2';
  const pairId = 'pair123';

  // MOCK ECDH Init
  useEffect(() => {
    // We mock the shared key generation here for UI demonstration
    const keyPair = CryptoService.generateKeyPair();
    setSharedKey(new Uint8Array(32)); // Dummy key for now
  }, []);

  useEffect(() => {
    if (!sharedKey) return;
    
    const q = query(collection(firestore, 'messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data() as MessageEnvelope;
        data.id = doc.id;
        
        // Decrypt immediately if we can
        let decrypted = null;
        try {
          decrypted = MessageService.decryptMessage(data, sharedKey);
        } catch (e) {
           // Decryption failed
        }
        
        return { ...data, decrypted };
      }).filter(m => m.pairId === pairId);
      
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [sharedKey]);

  const handleSendText = async () => {
    if (!text.trim() || !sharedKey) return;
    
    const payload = { text: text.trim() };
    setText('');
    
    await MessageService.sendMessage(pairId, currentUid, 'text', payload, sharedKey);
  };

  const handleAttachment = async (option: string) => {
    if (!sharedKey) return;
    
    if (option === 'gallery') {
      const payload = await MediaService.pickAndEncryptImage(sharedKey);
      if (payload) {
        await MessageService.sendMessage(pairId, currentUid, 'image', payload, sharedKey);
      }
    }
    // Implement other options...
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>YOUR PERSON</Text>
          <Text style={styles.headerSubtitle}>🔒 E2EE Active</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView 
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id!}
          inverted
          renderItem={({ item }) => (
            <MessageBubble 
              message={item} 
              isOwn={item.senderId === currentUid}
              decryptedPayload={item.decrypted}
            />
          )}
        />
        
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} onPress={() => sheetRef.current?.expand()}>
            <Text style={styles.attachIcon}>+</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor="#666666"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !text.trim() && { opacity: 0.5 }]} 
            onPress={handleSendText}
            disabled={!text.trim()}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <AttachmentSheet sheetRef={sheetRef} onSelectOption={handleAttachment} />
      <ImageViewer 
        visible={!!viewerImage} 
        imageUri={viewerImage} 
        onClose={() => setViewerImage(null)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: '#008b8b',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: '#666666',
    fontSize: 11,
    marginTop: 2,
  },
  settingsIcon: {
    fontSize: 24,
  },
  chatArea: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  attachButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  attachIcon: {
    color: '#008b8b',
    fontSize: 28,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    color: '#ffffff',
    fontSize: 16,
    marginHorizontal: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#008b8b',
    borderRadius: 20,
    marginBottom: 2,
  },
  sendIcon: {
    color: '#ffffff',
    fontSize: 16,
  },
});
