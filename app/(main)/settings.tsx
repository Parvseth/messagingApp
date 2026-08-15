import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.item}>
            <Text style={styles.itemText}>Profile</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.itemText}>Privacy</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.item}>
            <Text style={styles.itemText}>Encryption Keys</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attention Management</Text>
          <View style={[styles.item, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View>
              <Text style={styles.itemText}>Batched Notifications</Text>
              <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>Only deliver alerts at 9 AM, 1 PM, and 6 PM.</Text>
            </View>
            {/* Toggle switch placeholder */}
            <View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: '#008b8b', padding: 2 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: 'flex-end' }} />
            </View>
          </View>
          <View style={[styles.item, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View>
              <Text style={styles.itemText}>Allow Emergency Override</Text>
              <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>Let your partner ping you instantly bypassing batches.</Text>
            </View>
            <View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: '#008b8b', padding: 2 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: 'flex-end' }} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#ff5555' }]}>Danger Zone</Text>
          <TouchableOpacity style={styles.item}>
            <Text style={[styles.itemText, { color: '#ff5555' }]}>Unpair</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  closeIcon: {
    color: '#ffffff',
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#888888',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  item: {
    backgroundColor: '#121212',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemText: {
    color: '#ffffff',
    fontSize: 16,
  },
});
