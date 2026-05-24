from enum import Enum

class RunGamdlActionBodyAction(str, Enum):
    COOKIE_STATUS = "cookie_status"
    DELETE_COOKIE = "delete_cookie"
    RESET_SETTINGS = "reset_settings"
    TEST_CONNECTION = "test_connection"

    def __str__(self) -> str:
        return str(self.value)
