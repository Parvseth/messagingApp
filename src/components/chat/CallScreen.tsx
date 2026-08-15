import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { RTCView, MediaStream } from 'react-native-webrtc';
import { WebRTCService } from '../../services/webrtcService';

const { width, height } = Dimensions.get('window');

interface CallScreenProps {
  isIncoming: boolean;
  callId?: string; // If incoming, the ID of the call to join
  onEndCall: () => void;
}

export const CallScreen: React.FC<CallScreenProps> = ({ isIncoming, callId, onEndCall }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [rtcService] = useState(() => new WebRTCService((stream) => setRemoteStream(stream)));

  useEffect(() => {
    const initCall = async () => {
      const stream = await rtcService.setupMedia(false);
      setLocalStream(stream);

      if (isIncoming && callId) {
        await rtcService.joinCall(callId);
      } else {
        const newCallId = await rtcService.startCall();
        console.log('Started call with ID:', newCallId);
        // In a real app, send newCallId to peer via a silent push or a signaling message
      }
    };

    initCall();

    return () => {
      rtcService.endCall();
    };
  }, []);

  const handleHangUp = () => {
    rtcService.endCall();
    onEndCall();
  };

  return (
    <SafeAreaView style={styles.container}>
      {remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
        />
      ) : (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>
            {isIncoming ? 'Connecting...' : 'Waiting for peer...'}
          </Text>
        </View>
      )}

      {localStream && (
        <View style={styles.localVideoContainer}>
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            zOrder={1}
          />
        </View>
      )}

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.hangupButton} onPress={handleHangUp}>
          <Text style={styles.hangupIcon}>📞</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  remoteVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingText: {
    color: '#008b8b',
    fontSize: 18,
    letterSpacing: 1,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: width * 0.25,
    height: (width * 0.25) * 1.5,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1a1a1a',
    backgroundColor: '#1a1a1a',
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  hangupButton: {
    backgroundColor: '#ff5555',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  hangupIcon: {
    fontSize: 28,
    color: '#ffffff',
    transform: [{ rotate: '135deg' }],
  },
});
