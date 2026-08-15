import { RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices, MediaStream } from 'react-native-webrtc';
import { collection, doc, setDoc, updateDoc, onSnapshot, addDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';

const configuration = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
  ]
};

export class WebRTCService {
  public peerConnection: RTCPeerConnection | null = null;
  public localStream: MediaStream | null = null;
  public remoteStream: MediaStream | null = null;
  
  private onRemoteTrackCallback?: (stream: MediaStream) => void;
  private unsubscribeCall?: () => void;
  private unsubscribeOfferCandidates?: () => void;
  private unsubscribeAnswerCandidates?: () => void;

  constructor(onRemoteTrack?: (stream: MediaStream) => void) {
    this.onRemoteTrackCallback = onRemoteTrack;
  }

  async setupMedia(isAudioOnly: boolean = false): Promise<MediaStream | null> {
    try {
      this.peerConnection = new RTCPeerConnection(configuration);
      
      this.peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          this.remoteStream = event.streams[0];
          if (this.onRemoteTrackCallback) {
            this.onRemoteTrackCallback(this.remoteStream);
          }
        }
      };

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: isAudioOnly ? false : { width: 1280, height: 720, frameRate: 30, facingMode: 'user' }
      });
      
      this.localStream = stream as MediaStream;

      this.localStream.getTracks().forEach((track: any) => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      return this.localStream;
    } catch (e) {
      console.error('Failed to setup media:', e);
      return null;
    }
  }

  async startCall(): Promise<string | null> {
    if (!this.peerConnection) return null;

    try {
      const callDocRef = doc(collection(firestore, 'calls'));
      const offerCandidatesRef = collection(callDocRef, 'callerCandidates');
      const answerCandidatesRef = collection(callDocRef, 'calleeCandidates');

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(offerCandidatesRef, event.candidate.toJSON());
        }
      };

      const offerDescription = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offerDescription);

      await setDoc(callDocRef, { offer: offerDescription });

      // Listen for the Callee's Answer
      this.unsubscribeCall = onSnapshot(callDocRef, (snapshot) => {
        const data = snapshot.data();
        if (!this.peerConnection?.currentRemoteDescription && data?.answer) {
          const answerDescription = new RTCSessionDescription(data.answer);
          this.peerConnection?.setRemoteDescription(answerDescription);
        }
      });

      // Listen for Callee's ICE candidates
      this.unsubscribeAnswerCandidates = onSnapshot(answerCandidatesRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            this.peerConnection?.addIceCandidate(candidate);
          }
        });
      });

      return callDocRef.id;
    } catch (e) {
      console.error('Error starting call:', e);
      return null;
    }
  }

  async joinCall(callId: string): Promise<void> {
    if (!this.peerConnection) return;

    try {
      const callDocRef = doc(firestore, 'calls', callId);
      const offerCandidatesRef = collection(callDocRef, 'callerCandidates');
      const answerCandidatesRef = collection(callDocRef, 'calleeCandidates');

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(answerCandidatesRef, event.candidate.toJSON());
        }
      };

      const callData = (await getDoc(callDocRef)).data();
      if (!callData?.offer) throw new Error('Offer not found');

      const offerDescription = new RTCSessionDescription(callData.offer);
      await this.peerConnection.setRemoteDescription(offerDescription);

      const answerDescription = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answerDescription);

      await updateDoc(callDocRef, { answer: answerDescription });

      this.unsubscribeOfferCandidates = onSnapshot(offerCandidatesRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            this.peerConnection?.addIceCandidate(candidate);
          }
        });
      });
    } catch (e) {
      console.error('Error joining call:', e);
    }
  }

  endCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => track.stop());
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    
    // Clean up listeners
    if (this.unsubscribeCall) this.unsubscribeCall();
    if (this.unsubscribeOfferCandidates) this.unsubscribeOfferCandidates();
    if (this.unsubscribeAnswerCandidates) this.unsubscribeAnswerCandidates();

    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
  }
}
