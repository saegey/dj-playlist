from enum import Enum

class GetBackupPolicyResponse200PolicyProvider(str, Enum):
    RESTIC_B2 = "restic-b2"

    def __str__(self) -> str:
        return str(self.value)
