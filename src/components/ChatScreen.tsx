import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, StatusBar, Image, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { GiftedChat, IMessage, Bubble, InputToolbar, Send, MessageText, Actions } from 'react-native-gifted-chat';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db, firestore, auth } from '../config/firebase';
import { CryptoService } from '../services/cryptoService';
import { syncUserKeys, fetchPeerPublicKey } from '../services/authSetup';
import { MediaService } from '../services/mediaService';

interface ChatScreenProps {
  currentUid: string;
  currentEmail: string;
  peerUid: string;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ currentUid, currentEmail, peerUid }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [sharedKey, setSharedKey] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [mapVisible, setMapVisible] = useState(false);

  useEffect(() => {
    const loginAndStart = async () => {
      try {
        let userPassword = "";
        if (currentEmail === "parvs2004@gmail.com") {
          userPassword = "Parvseth@123";
        } else if (currentEmail === "gpriyal856@gmail.com") {
          userPassword = "Priyalgupta@123";
        } else {
          throw new Error(`Unknown email: ${currentEmail}. Update App.tsx!`);
        }

        await signInWithEmailAndPassword(auth, currentEmail, userPassword);
        console.log("Successfully logged in as:", currentEmail);

        setIsAuthenticated(true); // Now the app is allowed to load the chat
      } catch (error) {
        console.error("Login failed:", error);
      }
    };

    loginAndStart();
  }, [currentEmail]);

  // Key Initialization & ECDH Shared Key Derivation
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    async function initCrypto() {
      try {
        setLoading(true);
        setErrorStatus(null);

        const realUid = auth.currentUser!.uid;
        // 1. Sync self keys (SecureStore private key + Firestore public key)
        const myPrivateKey = await syncUserKeys(realUid, currentEmail);

        // 2. Fetch recipient's public key from Firestore
        const peerPubKey = await fetchPeerPublicKey(peerUid);
        if (!peerPubKey) {
          if (isMounted) {
            setErrorStatus('Waiting for peer to publish public key...');
            setLoading(false);
          }
          return;
        }

        // 3. Perform Diffie-Hellman (nacl.box.before) to derive shared symmetric key
        const derivedSharedKey = CryptoService.computeSharedKey(myPrivateKey, peerPubKey);

        if (isMounted) {
          setSharedKey(derivedSharedKey);
          setErrorStatus(null);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('[ChatScreen] Initialization error:', err);
        if (isMounted) {
          setErrorStatus('Failed to initialize E2EE key exchange: ' + (err.message || err));
          setLoading(false);
        }
      }
    }

    initCrypto();
    return () => {
      isMounted = false;
    };
  }, [currentUid, currentEmail, peerUid, isAuthenticated]);

  // Real-time Firestore Sync & On-Device Decryption Listener
  useEffect(() => {
    if (!sharedKey) return;

    const q = query(
      collection(firestore, 'messages'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const processMessages = async () => {
          const decryptedMsgs: IMessage[] = [];

          for (const docSnap of snapshot.docs) {
            const data = docSnap.data();

            const isBetweenUsers =
              (data.senderId === currentUid && data.receiverId === peerUid) ||
              (data.senderId === peerUid && data.receiverId === currentUid);

            if (isBetweenUsers && data.ciphertext && data.nonce) {
              const plainText = CryptoService.decryptMessage(
                data.ciphertext,
                data.nonce,
                sharedKey
              );
              
              let finalMessageText = plainText || '⚠️ [Decryption Failed]';
              let imageUrl = undefined;
              let locationObj = undefined;

              // Detect if the decrypted message is an inline image
              if (plainText && plainText.startsWith('data:image/')) {
                finalMessageText = '🖼️ Decrypting image...';
                
                // Write the image to disk to render it
                const localUri = await MediaService.saveDecryptedImageToTempFile(plainText);
                if (localUri) {
                  imageUrl = localUri;
                  finalMessageText = ''; // Hide text when image loads
                } else {
                  finalMessageText = '⚠️ [Image Render Failed]';
                }
              } else if (plainText && plainText.startsWith('geo:')) {
                const coords = plainText.replace('geo:', '').split(',');
                if (coords.length === 2) {
                  locationObj = { latitude: parseFloat(coords[0]), longitude: parseFloat(coords[1]) };
                  finalMessageText = ''; // Hide text
                }
              }

              decryptedMsgs.push({
                _id: docSnap.id,
                text: finalMessageText,
                image: imageUrl,
                location: locationObj,
                createdAt: data.createdAt?.toDate() ? data.createdAt.toDate() : new Date(),
                user: {
                  _id: data.senderId,
                  name: data.senderId === auth.currentUser?.uid ? 'Me' : 'Peer',
                },
              });
            }
          }
          setMessages(decryptedMsgs);
        };
        processMessages();
      },
      (error) => {
        console.error('[ChatScreen] Firestore listener error:', error);
      }
    );

    return () => unsubscribe();
  }, [sharedKey, currentUid, peerUid]);

  // Message Send Lifecycle (Encrypt Plaintext before database payload)
  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      if (!sharedKey) {
        console.warn('Cannot send message: Shared symmetric key not established.');
        return;
      }

      const messageToSend = newMessages[0];
      if (!messageToSend || !messageToSend.text) return;

      try {
        // 1. Authenticated symmetric encryption (nacl.box.after) with random 24-byte nonce
        const encryptedPayload = CryptoService.encryptMessage(messageToSend.text, sharedKey);

        // 2. Transmit CIPHERTEXT ONLY to Firestore (Plaintext NEVER touches the database)
        await addDoc(collection(firestore, 'messages'), {
          ciphertext: encryptedPayload.ciphertext,
          nonce: encryptedPayload.nonce,
          senderId: auth.currentUser!.uid,
          receiverId: peerUid,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('[ChatScreen] Error sending encrypted message:', err);
      }
    },
    [sharedKey, currentUid, peerUid]
  );

  // Show a black loading screen while Firebase connects
  const onSendImage = async () => {
    if (!sharedKey) {
      console.warn('Cannot send image: Shared key not established.');
      return;
    }
    
    // Pick, heavily compress, and encrypt the image!
    const encryptedPayload = await MediaService.pickAndEncryptImage(sharedKey);
    if (!encryptedPayload) return;
    
    // Store the encrypted image payload directly into the Firestore message document!
    await addDoc(collection(firestore, 'messages'), {
      senderId: auth.currentUser!.uid,
      receiverId: peerUid,
      ciphertext: encryptedPayload.ciphertext,
      nonce: encryptedPayload.nonce,
      createdAt: serverTimestamp(),
    });
  };

  const onShareLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Need location permissions to share your live location.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setMapVisible(false); // Close map
      const geoText = `geo:${loc.coords.latitude},${loc.coords.longitude}`;
      const encryptedPayload = CryptoService.encryptMessage(geoText, sharedKey!);
      await addDoc(collection(firestore, 'messages'), {
        ciphertext: encryptedPayload.ciphertext,
        nonce: encryptedPayload.nonce,
        senderId: auth.currentUser!.uid,
        receiverId: peerUid,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const renderActions = (props: any) => {
    return (
      <Actions
        {...props}
        options={{
          ['Send Encrypted Image']: onSendImage,
          Cancel: () => {},
        }}
        icon={() => (
          <Text style={{ color: '#008b8b', fontSize: 24, padding: 5 }}>+</Text>
        )}
      />
    );
  };

  const renderMessageImage = (props: any) => {
    const imageUrl = props.currentMessage.image;
    
    const handleImagePress = () => {
      Alert.alert(
        'Encrypted Image Options',
        'What would you like to do?',
        [
          {
            text: 'Save to Gallery',
            onPress: async () => {
              try {
                // Pass true to only request write permissions (fixes Android audio permission crash)
                const { status } = await MediaLibrary.requestPermissionsAsync(true);
                if (status === 'granted') {
                  await MediaLibrary.saveToLibraryAsync(imageUrl);
                  Alert.alert('Success', 'Image saved securely to your photo gallery!');
                } else {
                  Alert.alert('Permission Denied', 'Need gallery permissions to save.');
                }
              } catch (err) {
                console.error(err);
                Alert.alert('Error', 'Failed to save image.');
              }
            }
          },
          {
            text: 'Share to another App',
            onPress: async () => {
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(imageUrl, {
                  dialogTitle: 'Share Decrypted Image',
                });
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    };

    return (
      <TouchableOpacity 
        style={{ padding: 4 }}
        onPress={handleImagePress}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{ width: 220, height: 220, borderRadius: 13 }}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  };

  const renderCustomView = (props: any) => {
    if (props.currentMessage.location) {
      return (
        <View style={{ width: 200, height: 150, borderRadius: 13, margin: 3, overflow: 'hidden' }}>
          <MapView
            style={{ width: 200, height: 150 }}
            region={{
              latitude: props.currentMessage.location.latitude,
              longitude: props.currentMessage.location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker coordinate={props.currentMessage.location} />
          </MapView>
        </View>
      );
    }
    return null;
  };

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white' }}>Authenticating securely...</Text>
        <Text style={{ color: 'yellow', marginTop: 10 }}>If you see this briefly, login is working.</Text>
      </View>
    );
  }

  if (errorStatus) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <Text style={{ color: 'yellow', marginBottom: 20 }}>
          YOUR REAL FIREBASE UID IS: 
          {'\n'}{auth.currentUser?.uid}
        </Text>
        <Text style={styles.errorText}>{errorStatus}</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <ActivityIndicator size="large" color="#008b8b" />
        <Text style={styles.statusText}>Computing ECDH Shared Key...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 }]}>
        <View style={{ flex: 1 }} />
        <View style={{ flex: 2, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>SECURE CHAT</Text>
          <Text style={styles.headerSubtitle}>🔒 E2EE</Text>
        </View>
        <TouchableOpacity style={{ flex: 1, alignItems: 'flex-end' }} onPress={() => setMapVisible(true)}>
           <Text style={{ fontSize: 22 }}>📍</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={mapVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <MapView style={{ flex: 1 }} showsUserLocation={true} />
          <View style={{ position: 'absolute', bottom: 40, width: '100%', flexDirection: 'row', justifyContent: 'space-evenly' }}>
             <TouchableOpacity style={styles.mapButton} onPress={() => setMapVisible(false)}>
               <Text style={styles.mapButtonText}>Back to Chat</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.mapButton, { backgroundColor: '#008b8b' }]} onPress={onShareLocation}>
               <Text style={[styles.mapButtonText, { color: '#fff' }]}>Share Location</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <GiftedChat
          messages={messages}
          onSend={(msgs) => onSend(msgs)}
          user={{
            _id: auth.currentUser?.uid || currentUid,
            name: currentEmail,
          }}
          textInputProps={{ keyboardType: 'visible-password', autoCorrect: false }}
          messagesContainerStyle={{ backgroundColor: '#000000' }}
          renderActions={renderActions}
          renderMessageImage={renderMessageImage}
          renderCustomView={renderCustomView}
          alwaysShowSend
          showUserAvatar={false}
          renderAvatar={null}
          renderBubble={(props) => (
            <Bubble
              {...props}
              wrapperStyle={{
                right: {
                  backgroundColor: '#008b8b', // Outgoing: Muted cyan accent
                  borderRadius: 16,
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                },
                left: {
                  backgroundColor: '#121212', // Incoming: Deep dark gray
                  borderRadius: 16,
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                },
              }}
              textStyle={{
                right: { color: '#FFFFFF', fontSize: 15, fontFamily: 'System' },
                left: { color: '#E0E0E0', fontSize: 15, fontFamily: 'System' },
              }}
            />
          )}
          renderInputToolbar={(props) => (
            <InputToolbar
              {...props}
              containerStyle={styles.inputToolbar}
              textInputStyle={styles.inputStyle}
            />
          )}
          renderSend={(props) => (
            <Send {...props} containerStyle={styles.sendButton}>
              <Text style={styles.sendButtonText}>Send</Text>
            </Send>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#008b8b',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: '#666666',
    fontSize: 11,
    marginTop: 2,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  statusText: {
    color: '#888888',
    marginTop: 14,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#ff5555',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  inputToolbar: {
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inputStyle: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 6,
  },
  sendButtonText: {
    color: '#008b8b',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  mapButton: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333'
  },
  mapButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  }
});
