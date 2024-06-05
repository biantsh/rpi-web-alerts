from collections import Counter, deque


class Roller:
    def __init__(self, length: int) -> None:
        self.deque = deque(maxlen=length)

    def push(self, value: int) -> None:
        self.deque.append(value)

    def get_mode(self) -> int:
        return Counter(self.deque).most_common()[0][0]
