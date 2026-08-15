import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

export default function GeneratePairScreen() {
  const [loading, setLoading] = useState(false);
  const inviteLink = 'oneapp://pair/12345-abcde'; // Mock invite link

  const shareInvite = async () => {
    try {
      await Share.share({
        message: `Let's connect on ONE. My secure pairing link: ${inviteLink}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const skipForNow = () => {
    // For development, go straight to main
    router.replace('/(main)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Pairing</Text>
          <Text style={styles.subtitle}>Invite your person to connect</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Share your QR Code</Text>
          <View style={styles.qrContainer}>
            <QRCode
              value={inviteLink}
              size={200}
              color="#ffffff"
              backgroundColor="transparent"
            />
          </View>
          <Text style={styles.cardDesc}>
            Have them scan this code if they are nearby, or share the link below.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={shareInvite}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Share Invite Link</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.buttonSecondary}
          onPress={skipForNow}
        >
          <Text style={styles.buttonTextSecondary}>Enter an Invite Code Instead</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
  },
  card: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardTitle: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 24,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 24,
  },
  cardDesc: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#008b8b',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonSecondary: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonTextSecondary: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});
