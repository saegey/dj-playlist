from enum import Enum

class GetApiTracksIdEmbeddingPreviewType(str, Enum):
    AUDIO_VIBE = "audio_vibe"
    IDENTITY = "identity"
    PROMPT = "prompt"

    def __str__(self) -> str:
        return str(self.value)
