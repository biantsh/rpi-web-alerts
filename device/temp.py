import asyncio
import json
import os
import ssl
import threading

import numpy as np
import socketio
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer, MediaRelay
from aiortc.mediastreams import VideoStreamTrack
from av import VideoFrame

relay = None
webcam = None
pcs = set()


class VideoTransformTrack(VideoStreamTrack):
    def __init__(self, track):
        super().__init__()
        self.track = track

    async def recv(self):
        frame = await self.track.recv()

        image = frame.to_ndarray(format='rgb24')
        image = np.fliplr(image)

        new_frame = VideoFrame.from_ndarray(image, format='rgb24')
        new_frame.pts = frame.pts
        new_frame.time_base = frame.time_base

        return new_frame


async def create_local_tracks() -> VideoTransformTrack:
    global relay, webcam

    options = {
        'framerate': '30',
        'video_size': '1280x720'
    }
    webcam = MediaPlayer(
        'video=REDRAGON  Live Camera', format='dshow', options=options
    )

    relay = MediaRelay()

    return VideoTransformTrack(relay.subscribe(webcam.video))


async def handle_rtc_offer(data):
    room = data['room']
    params = data['offer']
    offer = RTCSessionDescription(sdp=params['sdp'], type=params['type'])

    pc = RTCPeerConnection()
    pcs.add(pc)

    @pc.on('connectionstatechange')
    async def on_connectionstatechange():
        print('Connection state is %s' % pc.connectionState)
        if pc.connectionState == 'failed':
            await pc.close()
            pcs.discard(pc)

    video = await create_local_tracks()

    if video:
        pc.addTrack(video)

    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    await sio.emit('rtcAnswer', {'sdp': pc.localDescription.sdp, 'type': pc.localDescription.type})


async def main():
    global sio

    sio = socketio.AsyncClient()

    @sio.event
    async def connect():
        print('Connected to server')

    @sio.event
    async def disconnect():
        print('Disconnected from server')

    @sio.event
    async def rtcOffer(data):
        loop = asyncio.get_event_loop()
        asyncio.run_coroutine_threadsafe(handle_rtc_offer(data), loop)

    await sio.connect('https://rpi-web-alerts.fly.dev')
    await sio.emit('pair-device', 'asd')

    while True:
        await sio.emit('ai-detections', {
            'person': 1,
            'bike': 0,
            'car': 0
        })
        await asyncio.sleep(1)

if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
