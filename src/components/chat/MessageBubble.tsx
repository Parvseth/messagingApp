import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessageEnvelope, MessageType, TextPayload } from '../../types/message';

interface MessageBubbleProps {
  message: MessageEnvelope;
  isOwn: boolean;
  decryptedPayload?: any; // The payload after decryption
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, decryptedPayload }) => {
  const renderContent = () => {
    if (!decryptedPayload) {
      return <Text style={styles.errorText}>Decrypting...</Text>;
    }

    switch (message.type) {
      case 'text':
        return <Text style={[styles.text, isOwn ? styles.ownText : null]}>{(decryptedPayload as TextPayload).text}</Text>;
      case 'image':
        return <Text style={[styles.text, isOwn ? styles.ownText : null]}>🖼️ Image: {decryptedPayload.fileName}</Text>;
      case 'document':
        return <Text style={[styles.text, isOwn ? styles.ownText : null]}>📄 Document: {decryptedPayload.fileName}</Text>;
      case 'contact':
        return <Text style={[styles.text, isOwn ? styles.ownText : null]}>👤 Contact: {decryptedPayload.name}</Text>;
      case 'location':
        return <Text style={[styles.text, isOwn ? styles.ownText : null]}>📍 Location</Text>;
      case 'event':
        return <Text style={[styles.text, isOwn ? styles.ownText : null]}>📅 Event: {decryptedPayload.title}</Text>;
      default:
        return <Text style={styles.errorText}>Unsupported message type</Text>;
    }
  };

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.peerContainer]}>
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.peerBubble]}>
        {renderContent()}
        <View style={styles.footer}>
          <Text style={styles.time}>
            {message.createdAt?.toDate ? message.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
          {isOwn && (
            <Text style={styles.status}>
              {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : message.status === 'sent' ? '✓' : '🕒'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  ownContainer: {
    justifyContent: 'flex-end',
  },
  peerContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#008b8b',
    borderBottomRightRadius: 4,
  },
  peerBubble: {
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 4,
  },
  text: {
    color: '#e0e0e0',
    fontSize: 16,
    lineHeight: 22,
  },
  ownText: {
    color: '#ffffff',
  },
  errorText: {
    color: '#ff5555',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  time: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
  },
  status: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
  },
});
