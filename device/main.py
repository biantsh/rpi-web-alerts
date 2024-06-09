import argparse
import asyncio
import queue
import threading
from collections import Counter

from lib.models import TFLiteModel
from lib.postprocessing import Roller
from lib.webrtc import sio, webrtc_client

ai_queue = webrtc_client.ai_queue


def _get_serial_number() -> str:
    with open('/proc/cpuinfo', 'r') as text_file:
        for line in text_file:
            if not line.startswith('Serial'):
                continue

            return line.split(':')[-1].strip()


def _run_model(model: TFLiteModel) -> None:
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    rollers = {category: Roller(length=10) for category in model.label_map}

    while True:
        frame = ai_queue.get()

        detections = model.get_detections(frame)
        counter = Counter([det.name for det in detections])

        for category in model.label_map:
            rollers[category].push(counter[category])

        loop.run_until_complete(sio.emit('ai-detections', {
            category: rollers[category].get_mode()
            for category in model.label_map
        }))


async def main(model_path: str, label_map: list[str], score_threshold: float) -> None:
    await sio.connect('https://rpi-web-alerts.fly.dev')
    await sio.emit('pair-device', _get_serial_number())

    model = TFLiteModel(model_path, label_map, score_threshold)
    threading.Thread(target=_run_model, args=(model,), daemon=True).start()

    await sio.wait()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-m', '--model_path', type=str)
    parser.add_argument('-l', '--label_map', nargs='+')
    parser.add_argument('-s', '--score_threshold', type=float)

    args = parser.parse_args()
    asyncio.run(main(args.model_path, args.label_map, args.score_threshold))
