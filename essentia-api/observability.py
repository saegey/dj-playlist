"""Exception-only Sentry setup for Essentia API."""

import os
from pathlib import PurePath


def _scrub_event(event: dict, _hint: dict) -> dict:
    event.pop("request", None)
    event.pop("user", None)
    event.pop("extra", None)
    event.pop("breadcrumbs", None)
    for value in event.get("exception", {}).get("values", []):
        value["value"] = "Exception details redacted"
        stacktrace = value.get("stacktrace") or {}
        for frame in stacktrace.get("frames") or []:
            if frame.get("filename"):
                frame["filename"] = PurePath(frame["filename"]).name
            if frame.get("abs_path"):
                frame["abs_path"] = PurePath(frame["abs_path"]).name
    return event


def init_sentry() -> bool:
    dsn = os.getenv("SENTRY_DSN")
    if not dsn:
        return False
    import sentry_sdk

    release = os.getenv("SENTRY_RELEASE") or None
    sentry_sdk.init(
        dsn=dsn,
        release=release,
        default_integrations=False,
        integrations=[],
        send_default_pii=False,
        include_local_variables=False,
        max_breadcrumbs=0,
        before_send=_scrub_event,
    )
    sentry_sdk.set_tag("service", os.getenv("SENTRY_SERVICE", "essentia-api"))
    if release:
        sentry_sdk.set_tag("release", release)
    return True


def capture_exception(error: BaseException) -> None:
    if os.getenv("SENTRY_DSN"):
        import sentry_sdk

        sentry_sdk.capture_exception(error)
