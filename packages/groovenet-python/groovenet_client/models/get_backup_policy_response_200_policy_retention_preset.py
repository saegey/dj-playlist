from enum import Enum

class GetBackupPolicyResponse200PolicyRetentionPreset(str, Enum):
    AGGRESSIVE = "aggressive"
    ARCHIVE = "archive"
    BALANCED = "balanced"

    def __str__(self) -> str:
        return str(self.value)
