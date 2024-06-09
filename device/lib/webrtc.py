import queue
import threading

import asyncio
import atexit
import json
import av
import aiortc
import numpy as np
import socketio

from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer, MediaRelay
from aiortc.mediastreams import VideoStreamTrack
from av import VideoFrame


class VideoTransformTrack(VideoStreamTrack):
    def __init__(self, track: aiortc.contrib.media.RelayStreamTrack) -> None:
        super().__init__()
        self.track = track

    async def recv(self) -> av.video.frame.VideoFrame:
        try:
            frame = await self.track.recv()
        except aiortc.mediastreams.MediaStreamError:
            await asyncio.sleep(0.1)
            return

        image = frame.to_ndarray(format='rgb24')
        image = np.fliplr(image)

        new_frame = VideoFrame.from_ndarray(image, format='rgb24')
        new_frame.pts = frame.pts
        new_frame.time_base = frame.time_base

        return new_frame


class WebRTCClient:
    def __init__(self) -> None:
        self.peer_connection = None
        self.webcam = None
        self.frame_queue = queue.Queue(maxsize=1)
        self.frame_lock = threading.Lock()

    async def create_local_tracks(self) -> VideoTransformTrack:
        options = {
            'framerate': '30',
            'video_size': '1280x720'
        }
        self.webcam = MediaPlayer(
            'video=REDRAGON  Live Camera', format='dshow', options=options
        )
        relay = MediaRelay()
        track = VideoTransformTrack(relay.subscribe(self.webcam.video))

        async def update_frame_queue():
            while True:
                frame = await track.recv()
                with self.frame_lock:
                    if self.frame_queue.full():
                        self.frame_queue.get_nowait()
                    self.frame_queue.put_nowait(frame)

        asyncio.create_task(update_frame_queue())

        return track

    def get_latest_frame(self):
        with self.frame_lock:
            if not self.frame_queue.empty():
                return self.frame_queue.get()
                
        return None

    async def handle_rtc_offer(self, data: dict) -> None:
        room, params = data['room'], data['offer']
        offer = RTCSessionDescription(sdp=params['sdp'], type=params['type'])

        video = await self.create_local_tracks()

        self.peer_connection = RTCPeerConnection()
        self.peer_connection.addTrack(video)

        await self.peer_connection.setRemoteDescription(offer)
        
        answer = await self.peer_connection.createAnswer()
        await self.peer_connection.setLocalDescription(answer)

        await sio.emit('rtcAnswer', {
            'sdp': self.peer_connection.localDescription.sdp, 
            'type': self.peer_connection.localDescription.type
        })

    async def handle_cleanup(self) -> None:
        if self.peer_connection:
            await self.peer_connection.close()
            self.peer_connection = None

        if self.webcam:
            self.webcam.video.stop()
            self.webcam = None

    async def cleanup(self) -> None:
        await self.handle_cleanup()


sio = socketio.AsyncClient()
webrtc_client = WebRTCClient()


@sio.event
async def rtcOffer(data: dict) -> None:
    loop = asyncio.get_event_loop()
    asyncio.run_coroutine_threadsafe(webrtc_client.handle_rtc_offer(data), loop)


@sio.event
async def rtcCleanup() -> None:
    await webrtc_client.cleanup()


atexit.register(asyncio.run, webrtc_client.handle_cleanup())
