from abc import ABC, abstractmethod
from fastapi import APIRouter


class PracticeMode(ABC):
    @abstractmethod
    def get_router(self) -> APIRouter:
        pass
