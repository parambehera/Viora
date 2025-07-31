// peer.js
import React, { createContext, useMemo, useCallback, useState, useEffect } from "react";

const peerContext = createContext(null);

export const usePeer = () => React.useContext(peerContext);

export const PeerProvider = ({ children }) => {
  const [remoteStream, setRemoteStream] = useState(null);
  const [isNegotiating, setIsNegotiating] = useState(false);
  
  const peer = useMemo(
    () =>
      new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      }),
    []
  );

  const createOffer = async () => {
    const offer = await peer.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await peer.setLocalDescription(offer);
    return offer;
  };

  const createAnswer = async (offer) => {
    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    return answer;
  };

  const setRemoteAnswer = async (ans) => {
    await peer.setRemoteDescription(new RTCSessionDescription(ans));
  };

  const sendStream = async (stream) => {
    // console.log("Adding stream tracks to peer connection...");
    
    const senders = peer.getSenders();
    const tracks = stream.getTracks();
    
    for (const track of tracks) {
      const existingSender = senders.find(sender => 
        sender.track && sender.track.kind === track.kind
      );
      
      if (existingSender) {
        // console.log(`Replacing ${track.kind} track`);
        await existingSender.replaceTrack(track);
      } else {
        // console.log(`Adding new ${track.kind} track`);
        peer.addTrack(track, stream);
      }
    }
    
    // console.log("Stream tracks added successfully");
  };

  const handleTrackEvent = useCallback((ev) => {
          // console.log("🎥 Received remote track event!");
    const streams = ev.streams;
    if (streams && streams[0]) {
              // console.log("Setting remote stream with tracks:", streams[0].getTracks().length);
      setRemoteStream(streams[0]);
    }
  }, []);

  const handleNegotiationNeeded = useCallback(() => {
          // console.log("🔄 Negotiation needed - tracks were added/modified");
    setIsNegotiating(true);
  }, []);

  const handleSignalingStateChange = useCallback(() => {
          // console.log("📡 Signaling state:", peer.signalingState);
    if (peer.signalingState === 'stable') {
      setIsNegotiating(false);
    }
  }, [peer]);

  useEffect(() => {
    peer.addEventListener('track', handleTrackEvent);
    peer.addEventListener('negotiationneeded', handleNegotiationNeeded);
    peer.addEventListener('signalingstatechange', handleSignalingStateChange);
    
    return () => {
      peer.removeEventListener('track', handleTrackEvent);
      peer.removeEventListener('negotiationneeded', handleNegotiationNeeded);
      peer.removeEventListener('signalingstatechange', handleSignalingStateChange);
    };
  }, [peer, handleTrackEvent, handleNegotiationNeeded, handleSignalingStateChange]);

  return (
    <peerContext.Provider value={{ 
      peer, 
      createOffer, 
      createAnswer, 
      setRemoteAnswer, 
      sendStream, 
      remoteStream,
      isNegotiating
    }}>
      {children}
    </peerContext.Provider>
  );
};