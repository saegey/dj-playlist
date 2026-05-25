from enum import Enum

class UpdateBackupPolicyBodyRetentionPreset(str, Enum):
    AGGRESSIVE = "aggressive"
    ARCHIVE = "archive"
    BALANCED = "balanced"

    def __str__(self) -> str:
        return str(self.value)
