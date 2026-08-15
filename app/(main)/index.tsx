import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import BottomSheet from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { MessageEnvelope } from '../../src/types/message';
import { MessageBubble } from '../../src/components/chat/MessageBubble';
import { AttachmentSheet } from '../../src/components/chat/AttachmentSheet';
import { ImageViewer } from '../../src/components/chat/ImageViewer';
import { CallScreen } from '../../src/components/chat/CallScreen';
import { MessageService } from '../../src/services/messageService';
import { CryptoService } from '../../src/services/cryptoService';
import { MediaService } from '../../src/services/mediaService';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../src/config/firebase';
import { LocalDatabase } from '../../src/services/localDatabase';

export default function ChatScreen() {
  const [messages, setMessages] = useState<(MessageEnvelope & { decrypted?: any })[]>([]);
  const [text, setText] = useState('');
  const [ratchet, setRatchet] = useState<any>(null); // Replace sharedKey with ratchet
  const sheetRef = useRef<BottomSheet>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [isViewOnceMode, setIsViewOnceMode] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);

  // MOCK: In reality, we'd get this from Zustand/Auth context
  const currentUid = 'user1';
  const peerUid = 'user2';
  const pairId = 'pair123';

  // MOCK ECDH Init -> Double Ratchet Init
  useEffect(() => {
    // We mock the Ratchet generation here for UI demonstration
    const sharedSecret = new Uint8Array(32); // From initial setup
    const initialRemotePubKey = CryptoService.generateKeyPair().publicKey; // Mock
    const newRatchet = new CryptoService.RatchetState(sharedSecret, true, initialRemotePubKey); // MOCK
    setRatchet(newRatchet);
  }, []);

  const loadLocalMessages = () => {
    const localMsgs = LocalDatabase.getMessages(pairId);
    setMessages(localMsgs);
  };

  useEffect(() => {
    if (!ratchet) return;
    
    // Initial load from local DB
    loadLocalMessages();
    
    const q = query(collection(firestore, 'messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let hasNewMessages = false;

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data() as MessageEnvelope;
          data.id = change.doc.id;
          
          if (data.pairId !== pairId) return;

          let decrypted = null;
          // If we receive a message from the peer, decrypt it
          if (data.senderId !== currentUid) {
            decrypted = MessageService.decryptMessage(data, ratchet);
            // Save incoming decrypted message to local DB
            LocalDatabase.saveMessage(data, decrypted, true);
            hasNewMessages = true;
          } else {
             // For our own messages, if they are synced, update their status in local DB
             const existingLocal = LocalDatabase.getMessages(pairId, 1, 0).find(m => m.id === data.id);
             if (existingLocal) {
               LocalDatabase.saveMessage({ ...existingLocal, status: 'sent', createdAt: data.createdAt }, existingLocal.decryptedPayload, true);
               hasNewMessages = true;
             }
          }
        } else if (change.type === 'removed') {
           LocalDatabase.deleteMessage(change.doc.id);
           hasNewMessages = true;
        }
      });
      
      if (hasNewMessages) {
        loadLocalMessages();
      }
    });

    return () => unsubscribe();
  }, [ratchet]);

  const handleDeleteMessage = async (id: string) => {
    try {
      // Hard delete from Local Database
      LocalDatabase.deleteMessage(id);
      
      // Update UI immediately
      loadLocalMessages();

      // Optionally delete from Firestore
      // await deleteDoc(doc(firestore, 'messages', id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendText = async () => {
    if (!text.trim() || !ratchet) return;
    
    const payload = { text: text.trim() };
    setText('');
    
    const ephemeralParams = isViewOnceMode ? { isViewOnce: true } : {};
    setIsViewOnceMode(false); // Reset after sending

    await MessageService.sendMessage(pairId, currentUid, 'text', payload, ratchet, undefined, ephemeralParams);
  };

  const handleAttachment = async (option: string) => {
    if (!ratchet) return;
    
    if (option === 'gallery') {
      const payload = await MediaService.pickAndEncryptImage(ratchet); // assuming mediaService updated too
      if (payload) {
        await MessageService.sendMessage(pairId, currentUid, 'image', payload, ratchet);
      }
    } else if (option === 'ping') {
      // Send an emergency ping that bypasses notification batches
      await MessageService.sendMessage(pairId, currentUid, 'text', { text: '🚨 Emergency Ping!' }, ratchet);
    } else if (option === 'capsule') {
      // Send a message that unlocks in the future
      const futureTime = Date.now() + 1000 * 60 * 60 * 24; // 24 hours from now
      await MessageService.sendMessage(pairId, currentUid, 'text', { text: '⏳ Time Capsule' }, ratchet, undefined, { expiresAt: futureTime });
    }
    // Implement other options...
  };

  const startVideoCall = () => {
    setIsCalling(true);
    setActiveCallId(null); // startCall will generate one
  };

  if (isCalling) {
    return (
      <CallScreen
        isIncoming={!!activeCallId}
        callId={activeCallId || undefined}
        onEndCall={() => {
          setIsCalling(false);
          setActiveCallId(null);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>YOUR PERSON</Text>
          <Text style={styles.headerSubtitle}>🔒 E2EE Active</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/vault')} style={styles.callButton}>
            <Text style={styles.callIcon}>🔐</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={startVideoCall} style={styles.callButton}>
            <Text style={styles.callIcon}>📹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <KeyboardAvoidingView 
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlashList
          data={messages}
          keyExtractor={(item) => item.id!}
          inverted
          estimatedItemSize={70}
          renderItem={({ item }) => (
            <MessageBubble 
              message={item} 
              isOwn={item.senderId === currentUid}
              decryptedPayload={item.decrypted}
              onDeleteMessage={handleDeleteMessage}
            />
          )}
        />
        
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} onPress={() => sheetRef.current?.expand()}>
            <Text style={styles.attachIcon}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.viewOnceToggleButton, isViewOnceMode && styles.viewOnceToggleButtonActive]} 
            onPress={() => setIsViewOnceMode(!isViewOnceMode)}
          >
            <Text style={styles.viewOnceToggleIcon}>{isViewOnceMode ? '💣' : '👁️'}</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder={isViewOnceMode ? "Send View Once..." : "Message..."}
            placeholderTextColor={isViewOnceMode ? "#ff5555" : "#666666"}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  callButton: {
    padding: 4,
  },
  callIcon: {
    fontSize: 24,
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
  viewOnceToggleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  viewOnceToggleButtonActive: {
    backgroundColor: '#ff5555',
  },
  viewOnceToggleIcon: {
    fontSize: 18,
  },
});
