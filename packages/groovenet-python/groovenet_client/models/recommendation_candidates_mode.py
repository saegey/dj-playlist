from enum import Enum

class RecommendationCandidatesMode(str, Enum):
    AUDIO = "audio"
    COMBINED = "combined"
    IDENTITY = "identity"

    def __str__(self) -> str:
        return str(self.value)
