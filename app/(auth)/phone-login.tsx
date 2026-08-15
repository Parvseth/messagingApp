import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
// import { auth } from '@/config/firebase'; // We will set this up later
// import { signInWithPhoneNumber } from 'firebase/auth';

export default function PhoneLoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestOTP = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    
    setLoading(true);
    try {
      // Mock for now until Firebase is fully connected
      // const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      // setVerificationId(confirmation.verificationId);
      
      // MOCK
      setTimeout(() => {
        setVerificationId('mock-id');
        setLoading(false);
      }, 1000);
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error.message);
    }
  };

  const verifyOTP = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      // Mock for now
      // const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      // await signInWithCredential(auth, credential);
      
      // MOCK
      setTimeout(() => {
        setLoading(false);
        router.replace('/create-profile');
      }, 1000);
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {verificationId ? 'Verify Code' : 'Your Phone'}
          </Text>
          <Text style={styles.subtitle}>
            {verificationId 
              ? `Enter the code sent to ${phoneNumber}` 
              : 'Enter your phone number to get started'}
          </Text>
        </View>

        <View style={styles.form}>
          {!verificationId ? (
            <View style={styles.inputContainer}>
              <Text style={styles.prefix}>+</Text>
              <TextInput
                style={styles.input}
                placeholder="1 234 567 8900"
                placeholderTextColor="#555555"
                keyboardType="phone-pad"
                autoComplete="tel"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                editable={!loading}
              />
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { textAlign: 'center', letterSpacing: 8 }]}
                placeholder="123456"
                placeholderTextColor="#555555"
                keyboardType="number-pad"
                autoComplete="one-time-code"
                value={verificationCode}
                onChangeText={setVerificationCode}
                maxLength={6}
                editable={!loading}
              />
            </View>
          )}

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={verificationId ? verifyOTP : requestOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>
                {verificationId ? 'Verify' : 'Continue'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardView: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
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
  form: {
    gap: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  prefix: {
    color: '#ffffff',
    fontSize: 18,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 18,
  },
  button: {
    backgroundColor: '#008b8b',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
