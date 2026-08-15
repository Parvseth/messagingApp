import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>ONE</Text>
          <Text style={styles.subtitle}>Focused 1:1 Messaging</Text>
        </View>
        
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🤫</Text>
            <View>
              <Text style={styles.featureTitle}>Zero Noise</Text>
              <Text style={styles.featureDesc}>One app. One person. No groups or feeds.</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔒</Text>
            <View>
              <Text style={styles.featureTitle}>End-to-End Encrypted</Text>
              <Text style={styles.featureDesc}>Not even we can read your messages.</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔗</Text>
            <View>
              <Text style={styles.featureTitle}>Simple Pairing</Text>
              <Text style={styles.featureDesc}>Pair with your person. That's it.</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/phone-login')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
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
    marginBottom: 60,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#008b8b',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  features: {
    gap: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    fontSize: 32,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: '#888888',
  },
  footer: {
    padding: 24,
  },
  button: {
    backgroundColor: '#008b8b',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
