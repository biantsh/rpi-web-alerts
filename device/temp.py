import asyncio
import threading
from concurrent.futures import ThreadPoolExecutor
from lib.webrtc import sio, webrtc_client
from lib.models import TFLiteModel

MODEL_PATH = 'C:\\Users\\shkol\\Downloads\\model.tflite'
LABEL_MAP = ['person', 'bike', 'car']
SCORE_THRESHOLD = 0.5

tflite_model = TFLiteModel(MODEL_PATH, LABEL_MAP, SCORE_THRESHOLD)

def run_model_thread():
    while True:
        frame = webrtc_client.get_latest_frame()
        if frame:
            detections = tflite_model.run_on_frame(frame)
            result = {detection.name: 1 for detection in detections}
            asyncio.run(sio.emit('ai-detections', result))

async def main() -> None:
    await sio.connect('https://rpi-web-alerts.fly.dev')
    await sio.emit('pair-device', 'asd')

    with ThreadPoolExecutor(max_workers=1) as executor:
        threading.Thread(target=run_model_thread, daemon=True).start()

    await sio.wait()

if __name__ == '__main__':
    asyncio.run(main())
