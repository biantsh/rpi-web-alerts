import asyncio
import json
import queue
import threading

import aiortc
import av
import numpy as np
import socketio
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer, MediaRelay
from aiortc.mediastreams import VideoStreamTrack
from av import VideoFrame

class FrameProcessor:
    def __init__(self, track: VideoStreamTrack, ai_queue: queue.Queue) -> None:
        self.track = track
        self.ai_queue = ai_queue

        self.stop_event = threading.Event()

    async def start(self) -> None:
        while not self.stop_event.is_set():
            frame = await self.track.recv()

            if not self.ai_queue.full():
                self.ai_queue.put_nowait(frame.to_ndarray(format='rgb24'))


class WebRTCClient:
    def __init__(self, ai_queue: queue.Queue) -> None:
        self.ai_queue = ai_queue
        
        self.webcam = None
        self.peer_connection = None
        self.frame_processor = None

    async def create_local_track(self) -> VideoStreamTrack:
        options = {
            'framerate': '30',
            'video_size': '1280x720'
        }
        self.webcam = MediaPlayer(
            'video=REDRAGON  Live Camera',
            format='dshow', options=options
        )
        relay = MediaRelay()
        track = relay.subscribe(self.webcam.video)

        self.frame_processor = FrameProcessor(track, self.ai_queue)
        asyncio.create_task(self.frame_processor.start())

        return track

    async def handle_rtc_offer(self, data: dict) -> None:
        room, params = data['room'], data['offer']
        offer = RTCSessionDescription(sdp=params['sdp'], type=params['type'])

        video = await self.create_local_track()

        self.peer_connection = RTCPeerConnection()
        self.peer_connection.addTrack(video)

        await self.peer_connection.setRemoteDescription(offer)

        answer = await self.peer_connection.createAnswer()
        await self.peer_connection.setLocalDescription(answer)

        await sio.emit('rtcAnswer', {
            'sdp': self.peer_connection.localDescription.sdp, 
            'type': self.peer_connection.localDescription.type
        })

    async def cleanup(self) -> None:
        if self.peer_connection:
            await self.peer_connection.close()
            self.peer_connection = None

        if self.frame_processor:
            self.frame_processor.stop_event.set()
            self.frame_processor = None

        if self.webcam:
            self.webcam.video.stop()
            self.webcam = None


sio = socketio.AsyncClient()
webrtc_client = WebRTCClient(queue.Queue(maxsize=1))

@sio.event
async def rtcOffer(data: dict) -> None:
    loop = asyncio.get_event_loop()
    asyncio.run_coroutine_threadsafe(webrtc_client.handle_rtc_offer(data), loop)

@sio.event
async def rtcCleanup() -> None:
    await webrtc_client.cleanup()
