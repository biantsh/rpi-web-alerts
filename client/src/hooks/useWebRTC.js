import { useRef, useState, useEffect } from "react";
import { io } from "socket.io-client";

const useWebRTC = deviceSn => {
  const [paired, setPaired] = useState(false);
  const peerConnection = useRef(null);
  const socket = useRef(io()).current;

  useEffect(() => {
    socket.emit('pair-user', deviceSn);

    socket.on('pair-device', isPaired => {
      setPaired(isPaired);

      if (isPaired && !peerConnection.current) {
        initializePeerConnection();
        negotiateRTC();
      }
    });

    socket.on('rtcAnswer', answer => {
      if (peerConnection.current) {
        peerConnection.current.setRemoteDescription(answer);
      }
    });

    return () => {
      socket.off('pair-device');
      socket.off('rtcAnswer');
    };
  }, [deviceSn, socket]);

  const initializePeerConnection = () => {
    peerConnection.current = new RTCPeerConnection({
      sdpSemantics: 'unified-plan',
      iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }]
    });

    peerConnection.current.addEventListener('track', event => {
      document.getElementById('video').srcObject = event.streams[0];
    });
  };

  const negotiateRTC = () => {
    peerConnection.current.addTransceiver('video', { direction: 'recvonly' });

    peerConnection.current.createOffer().then(offer => {
      return peerConnection.current.setLocalDescription(offer);
    }).then(() => {
      return new Promise(resolve => {
        if (peerConnection.current.iceGatheringState === 'complete') {
          resolve();
        } else {
          const checkState = () => {
            if (peerConnection.current.iceGatheringState === 'complete') {
              peerConnection.current.removeEventListener('icegatheringstatechange', checkState);
              resolve();
            }
          };
          peerConnection.current.addEventListener('icegatheringstatechange', checkState);
        }
      });
    }).then(() => {
      const offer = peerConnection.current.localDescription;

      socket.emit('rtcOffer', {
        room: deviceSn,
        offer: {
          sdp: offer.sdp,
          type: offer.type
        }
      });
    });
  };

  return { paired, socket };
};

export default useWebRTC;
