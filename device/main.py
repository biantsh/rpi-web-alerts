import time

import socketio

sio = socketio.Client()

sio.connect('https://rpi-web-alerts.fly.dev')
sio.emit('pair-device', '123')

while True:
    sio.emit('ai-detections', {'person': 1, 'bike': 0, 'car': 0})
    time.sleep(1)
