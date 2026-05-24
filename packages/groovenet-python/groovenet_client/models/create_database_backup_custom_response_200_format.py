from enum import Enum

class CreateDatabaseBackupCustomResponse200Format(str, Enum):
    CUSTOM = "custom"

    def __str__(self) -> str:
        return str(self.value)
