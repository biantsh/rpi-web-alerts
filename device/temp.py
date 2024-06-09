import asyncio

from lib.webrtc import sio


async def main() -> None:
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
