import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Modal } from 'react-native';

interface ImageViewerProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onSave?: () => void;
  onShare?: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ visible, imageUri, onClose, onSave, onShare }) => {
  if (!imageUri) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <Text style={styles.icon}>✕</Text>
          </TouchableOpacity>
          <View style={styles.actions}>
            {onShare && (
              <TouchableOpacity onPress={onShare} style={styles.iconButton}>
                <Text style={styles.icon}>📤</Text>
              </TouchableOpacity>
            )}
            {onSave && (
              <TouchableOpacity onPress={onSave} style={styles.iconButton}>
                <Text style={styles.icon}>📥</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 8,
  },
  icon: {
    color: '#ffffff',
    fontSize: 24,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
