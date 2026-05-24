from enum import Enum

class ListJobsState(str, Enum):
    ACTIVE = "active"
    ALL = "all"
    COMPLETED = "completed"
    FAILED = "failed"
    WAITING = "waiting"

    def __str__(self) -> str:
        return str(self.value)
