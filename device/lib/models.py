from typing import Sequence

import cv2 as cv
import numpy as np
import tensorflow as tf
from av import VideoFrame

from lib.detections import Detection


class TFLiteModel(tf.lite.Interpreter):
    def __init__(self, model_path: str, label_map: Sequence, score_threshold: float) -> None:
        super().__init__(model_path, num_threads=4)
        self.allocate_tensors()

        self.label_map = label_map
        self.score_threshold = score_threshold

        self.input_details = self.get_input_details()[0]
        self.output_details = self.get_output_details()

    def _preprocess(self, image: np.ndarray) -> np.ndarray:
        _, height, width, _ = self.input_details['shape']
        data_type = self.input_details['dtype']

        image = cv.resize(image, (width, height))
        image = cv.cvtColor(image, cv.COLOR_BGR2RGB)
        tensor = np.expand_dims(image, 0).astype(data_type)

        return tensor

    def _predict(self, tensor: np.ndarray) -> list[np.ndarray]:
        self.set_tensor(self.input_details['index'], tensor)
        self.invoke()

        return [
            np.squeeze(self.get_tensor(output['index']))
            for output in self.output_details
        ]

    def get_detections(self, image: np.ndarray) -> list[Detection]:
        tensor = self._preprocess(image)
        predictions = self._predict(tensor)

        scores, bboxes, _, categories = predictions.copy()
        image_height, image_width, _ = image.shape

        detections = []

        for score, bbox, category in zip(scores, bboxes, categories):
            if score < self.score_threshold:
                continue

            top, left, bottom, right = bbox.copy()
            top = int(top * image_height)
            left = int(left * image_width)
            right = int(right * image_width)
            bottom = int(bottom * image_height)

            position = [top, left, bottom, right]
            name = self.label_map[int(category)]

            detections.append(Detection(name, score, position))

        return detections

    def run_on_frame(self, frame: VideoFrame) -> list[Detection]:
        image = frame.to_ndarray(format='bgr24')
        detections = self.get_detections(image)
        
        return detections
