import { useRef, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

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

    socket.on('rtcCleanup', () => {
      if (peerConnection.current) {
        peerConnection.current.getSenders().forEach(sender => {
          if (sender.track) {
            sender.track.stop();
          }
        });
        peerConnection.current.close();
        peerConnection.current = null;
      }
  
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
  
      setPaired(false);
    });
  }, [deviceSn, socket]);

  const initializePeerConnection = () => {
    peerConnection.current = new RTCPeerConnection({
      sdpSemantics: 'unified-plan',
      iceServers: [{ urls: 'stun:stun.1und1.de:3478' }]
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
        console.log('Beginning ICE gathering...')
        if (peerConnection.current.iceGatheringState === 'complete') {
          console.log('ICE gathering complete.');
          resolve();

        } else {
          const checkState = () => {
            console.log(`ICE gathering state: ${peerConnection.current.iceGatheringState}...`)
            if (peerConnection.current.iceGatheringState === 'complete') {
              peerConnection.current.removeEventListener('icegatheringstatechange', checkState);
              console.log('ICE gathering complete.');
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
