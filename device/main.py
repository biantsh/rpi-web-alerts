import argparse
import time
from collections import Counter

import cv2 as cv
import socketio

from lib.models import TFLiteModel


def _get_serial_number() -> str:
    with open('/proc/cpuinfo', 'r') as text_file:
        for line in text_file:
            if not line.startswith('Serial'):
                continue

            return line.split(':')[-1].strip()


def main(model_path: str, label_map: list[str], score_threshold: float) -> None:
    sio = socketio.Client()

    sio.connect('https://rpi-web-alerts.fly.dev')
    sio.emit('pair-device', _get_serial_number())

    model = TFLiteModel(model_path, label_map, score_threshold)
    webcam = cv.VideoCapture(0)

    while webcam.isOpened():
        success, frame = webcam.read()
        assert success

        detections = model.get_detections(frame)
        detections = [det.name for det in detections]
        counter = Counter(detections)

        sio.emit('ai-detections', {
            category: counter[category]
            for category in label_map}
        )


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-m', '--model_path', type=str)
    parser.add_argument('-l', '--label_map', nargs='+')
    parser.add_argument('-s', '--score_threshold', type=float)

    args = parser.parse_args()
    main(args.model_path, args.label_map, args.score_threshold)
