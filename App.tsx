import 'react-native-get-random-values';

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as ScreenCapture from 'expo-screen-capture';
import { doc, deleteDoc } from 'firebase/firestore';
import { firestore } from './src/config/firebase';
import { ChatScreen } from './src/components/ChatScreen';

export default function App() {
  const [selectedUser, setSelectedUser] = useState<'parvs' | 'priyal' | null>(null);

  useEffect(() => {
    // Block screenshots and screen recording OS-wide while app is open
    ScreenCapture.preventScreenCaptureAsync();
  }, []);

  if (!selectedUser) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.selectionContainer}>
          <Text style={styles.title}>E2EE CHAT</Text>
          <Text style={styles.subtitle}>Select your identity to authenticate</Text>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => setSelectedUser('parvs')}
          >
            <Text style={styles.buttonText}>Log in as po</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => setSelectedUser('priyal')}
          >
            <Text style={styles.buttonText}>Log in as mo</Text>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    );
  }

  // Dynamically assign the correct UIDs based on who tapped the button
  const currentUid = selectedUser === 'parvs' 
    ? 'Hu71Ftwfc7UlBimz9urREpC1P2m2' 
    : 'glzHLYlhewUXfltKRhV0PJIqTTE2';
    
  const currentEmail = selectedUser === 'parvs' 
    ? 'po' 
    : 'mo';
    
  const peerUid = selectedUser === 'parvs' 
    ? 'glzHLYlhewUXfltKRhV0PJIqTTE2' 
    : 'Hu71Ftwfc7UlBimz9urREpC1P2m2';

  return (
    <SafeAreaProvider style={styles.container}>
      <ChatScreen
        currentUid={currentUid}
        currentEmail={currentEmail}
        peerUid={peerUid}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  selectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 4,
  },
  subtitle: {
    color: '#666666',
    marginBottom: 60,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  button: {
    backgroundColor: '#008b8b', // Muted cyan accent
    width: '100%',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonSecondary: {
    backgroundColor: '#1a1a1a', // Dark gray
    borderWidth: 1,
    borderColor: '#333333',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
