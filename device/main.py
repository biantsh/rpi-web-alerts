import argparse
import asyncio
import multiprocessing
import threading
from collections import Counter

from lib.models import TFLiteModel
from lib.postprocessing import Roller
from lib.webrtc import sio, webrtc_client

ai_frames_queue = webrtc_client.ai_queue
ai_results_queue = multiprocessing.Queue(maxsize=1)


def _get_serial_number() -> str:
    with open('/proc/cpuinfo', 'r') as text_file:
        for line in text_file:
            if not line.startswith('Serial'):
                continue

            return line.split(':')[-1].strip()


def _run_model(model_path: str, label_map: list[str], score_threshold: float) -> None:
    model = TFLiteModel(model_path, label_map, score_threshold)
    rollers = {category: Roller(length=3) for category in model.label_map}

    while True:
        if ai_frames_queue.empty():
            continue

        frame = ai_frames_queue.get()
        detections = model.get_detections(frame)
        counter = Counter([det.name for det in detections])

        for category in model.label_map:
            rollers[category].push(counter[category])

        ai_results_queue.put({
            category: rollers[category].get_mode()
            for category in model.label_map
        })


async def main(model_path: str, label_map: list[str], score_threshold: float) -> None:
    await sio.connect('https://rpi-web-alerts.fly.dev')
    await sio.emit('pair-device', _get_serial_number())

    multiprocessing.Process(
        target=_run_model, 
        args=(model_path, label_map, score_threshold)
    ).start()

    while True:
        results = {} if ai_results_queue.empty() else ai_results_queue.get()

        await sio.emit('ai-detections', results)
        await asyncio.sleep(1)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-m', '--model_path', type=str, required=True)
    parser.add_argument('-l', '--label_map', nargs='+', required=True)
    parser.add_argument('-s', '--score_threshold', type=float, required=True)

    args = parser.parse_args()
    asyncio.run(main(args.model_path, args.label_map, args.score_threshold))
