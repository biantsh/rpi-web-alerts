import asyncio
import json

import av
import aiortc
import numpy as np
import socketio
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer, MediaRelay
from aiortc.mediastreams import VideoStreamTrack
from av import VideoFrame

sio = socketio.AsyncClient()


class VideoTransformTrack(VideoStreamTrack):
    def __init__(self, track: aiortc.contrib.media.RelayStreamTrack) -> None:
        super().__init__()
        self.track = track

    async def recv(self) -> av.video.frame.VideoFrame:
        frame = await self.track.recv()

        image = frame.to_ndarray(format='rgb24')
        image = np.fliplr(image)

        new_frame = VideoFrame.from_ndarray(image, format='rgb24')
        new_frame.pts = frame.pts
        new_frame.time_base = frame.time_base

        return new_frame


async def create_local_tracks() -> VideoTransformTrack:
    options = {
        'framerate': '30',
        'video_size': '1280x720'
    }
    webcam = MediaPlayer(
        'video=REDRAGON  Live Camera', format='dshow', options=options
    )
    relay = MediaRelay()

    return VideoTransformTrack(relay.subscribe(webcam.video))


async def handle_rtc_offer(data: dict) -> None:
    room, params = data['room'], data['offer']
    offer = RTCSessionDescription(sdp=params['sdp'], type=params['type'])

    video = await create_local_tracks()

    peer_connection = RTCPeerConnection()
    peer_connection.addTrack(video)

    await peer_connection.setRemoteDescription(offer)
    
    answer = await peer_connection.createAnswer()
    await peer_connection.setLocalDescription(answer)

    await sio.emit('rtcAnswer', {
        'sdp': peer_connection.localDescription.sdp, 
        'type': peer_connection.localDescription.type
    })


@sio.event
async def rtcOffer(data: dict) -> None:
    loop = asyncio.get_event_loop()
    asyncio.run_coroutine_threadsafe(handle_rtc_offer(data), loop)
