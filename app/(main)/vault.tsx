import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// Mock data
const mockPhotos = [
  { id: '1', uri: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=400&q=80' },
  { id: '2', uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80' },
  { id: '3', uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80' },
  { id: '4', uri: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80' },
];

const mockTodos = [
  { id: '1', text: 'Groceries (Milk, Eggs, Bread)', completed: false },
  { id: '2', text: 'Book flights for weekend trip', completed: true },
  { id: '3', text: 'Call the plumber', completed: false },
];

export default function VaultScreen() {
  const [activeTab, setActiveTab] = useState<'gallery' | 'todos'>('gallery');
  const [todos, setTodos] = useState(mockTodos);

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const renderGallery = () => (
    <FlatList
      data={mockPhotos}
      keyExtractor={item => item.id}
      numColumns={2}
      contentContainerStyle={styles.galleryContainer}
      renderItem={({ item }) => (
        <View style={styles.photoContainer}>
          <Image source={{ uri: item.uri }} style={styles.photo} />
        </View>
      )}
    />
  );

  const renderTodos = () => (
    <FlatList
      data={todos}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.todosContainer}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.todoItem} onPress={() => toggleTodo(item.id)}>
          <View style={[styles.checkbox, item.completed && styles.checkboxCompleted]}>
            {item.completed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.todoText, item.completed && styles.todoTextCompleted]}>
            {item.text}
          </Text>
        </TouchableOpacity>
      )}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>THE VAULT</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'gallery' && styles.activeTab]} 
          onPress={() => setActiveTab('gallery')}
        >
          <Text style={[styles.tabText, activeTab === 'gallery' && styles.activeTabText]}>Photos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'todos' && styles.activeTab]} 
          onPress={() => setActiveTab('todos')}
        >
          <Text style={[styles.tabText, activeTab === 'todos' && styles.activeTabText]}>To-Do</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentArea}>
        {activeTab === 'gallery' ? renderGallery() : renderTodos()}
      </View>

      <TouchableOpacity style={styles.floatingAction}>
        <Text style={styles.floatingActionIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backButton: { padding: 4 },
  backIcon: { color: '#008b8b', fontSize: 24 },
  headerTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', letterSpacing: 2 },
  placeholder: { width: 32 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0a',
    padding: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: { backgroundColor: '#1a1a1a' },
  tabText: { color: '#666666', fontSize: 14, fontWeight: '600' },
  activeTabText: { color: '#008b8b' },
  contentArea: { flex: 1 },
  galleryContainer: { padding: 4 },
  photoContainer: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  todosContainer: { padding: 16 },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666666',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#008b8b',
    borderColor: '#008b8b',
  },
  checkmark: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  todoText: { color: '#ffffff', fontSize: 16, flex: 1 },
  todoTextCompleted: { color: '#666666', textDecorationLine: 'line-through' },
  floatingAction: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#008b8b',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  floatingActionIcon: { color: '#ffffff', fontSize: 28, fontWeight: '300' },
});
