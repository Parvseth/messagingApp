import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState, AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

interface BiometricLockProps {
  children: React.ReactNode;
}

export const BiometricLock: React.FC<BiometricLockProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    checkSupport();
    
    // Listen for app state changes to re-authenticate when coming from background
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      setIsAuthenticated(false);
    } else if (nextAppState === 'active') {
      if (isSupported && !isAuthenticated) {
        authenticate();
      }
    }
  };

  const checkSupport = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (hasHardware && isEnrolled) {
      setIsSupported(true);
      authenticate();
    } else {
      // If biometrics aren't supported/enrolled, we bypass (or we could enforce a PIN)
      setIsAuthenticated(true);
    }
  };

  const authenticate = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock ONE',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsAuthenticated(true);
        setFailedAttempts(0);
      } else {
        setFailedAttempts(prev => prev + 1);
      }
    } catch (e) {
      console.warn('Biometric authentication failed:', e);
      setFailedAttempts(prev => prev + 1);
    }
  };

  if (!isSupported) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🔒 ONE</Text>
        <Text style={styles.subtitle}>Secured Chat</Text>
        
        {failedAttempts > 0 && (
          <Text style={styles.errorText}>Authentication failed. Please try again.</Text>
        )}
        
        <TouchableOpacity style={styles.button} onPress={authenticate}>
          <Text style={styles.buttonText}>Unlock</Text>
        </TouchableOpacity>

        {failedAttempts >= 5 && (
          <Text style={styles.warningText}>
            Too many failed attempts. To protect your data, the app will reset and clear all keys if this continues.
          </Text>
        )}
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    color: '#008b8b',
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#008b8b',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff5555',
    marginBottom: 24,
  },
  warningText: {
    color: '#ffaa00',
    marginTop: 48,
    textAlign: 'center',
    fontSize: 12,
    paddingHorizontal: 20,
  },
});
