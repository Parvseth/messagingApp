import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MessageEnvelope, MessageType, TextPayload } from '../../types/message';

interface MessageBubbleProps {
  message: MessageEnvelope;
  isOwn: boolean;
  decryptedPayload?: any; // The payload after decryption
  onDeleteMessage?: (id: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, decryptedPayload, onDeleteMessage }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isConsumed, setIsConsumed] = useState(false);

  const handleReveal = () => {
    if (isConsumed) return;
    setIsRevealed(true);
    
    // View once messages self-destruct after viewing
    if (message.isViewOnce) {
      Alert.alert(
        "View Once Message",
        "This message will be permanently deleted after you close this.",
        [{ text: "OK", onPress: () => {
            setIsRevealed(false);
            setIsConsumed(true);
            if (onDeleteMessage && message.id) {
              onDeleteMessage(message.id);
            }
        }}]
      );
    }
  };

  const renderContent = () => {
    if (isConsumed) {
      return <Text style={styles.consumedText}>💣 Message expired</Text>;
    }

    if (message.isViewOnce && !isRevealed && !isOwn) {
      return (
        <TouchableOpacity onPress={handleReveal} style={styles.viewOnceButton}>
          <Text style={styles.viewOnceText}>🔒 Tap to view (View Once)</Text>
        </TouchableOpacity>
      );
    }

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
          {message.expiresAt && (
            <Text style={styles.timerIcon}>⏳</Text>
          )}
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
  timerIcon: {
    fontSize: 11,
    marginRight: 2,
  },
  consumedText: {
    color: '#888888',
    fontStyle: 'italic',
    fontSize: 14,
  },
  viewOnceButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewOnceText: {
    color: '#00ffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
