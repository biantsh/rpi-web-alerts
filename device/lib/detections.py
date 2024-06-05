from typing import Sequence


class Detection:
    def __init__(self, name: str, score: float, position: Sequence) -> None:
        self.name = name
        self.score = score
        self.position = tuple(position)

    def __repr__(self) -> str:
        return f'[{self.name.title()} ({self.score:.1%}) {self.position}]'
