"""Round-trip the generated album contracts without editing generated code.

Run with the bootstrapped worker environment:
PYTHONPATH=packages/groovenet-python download-worker/.venv/bin/python -m pytest scripts/test-generated-album-overrides.py
"""

from importlib import import_module
from uuid import UUID

import pytest

ID = "00000000-0000-4000-8000-000000000001"
MODELS = [
    ("update_album_body", "UpdateAlbumBody"),
    ("get_album_detail_response_200_album", "GetAlbumDetailResponse200Album"),
    ("search_albums_response_200_hits_item", "SearchAlbumsResponse200HitsItem"),
    ("update_album_response_200_album", "UpdateAlbumResponse200Album"),
    ("upsert_album_with_tracks_response_200_album", "UpsertAlbumWithTracksResponse200Album"),
]


@pytest.mark.parametrize("module_name,class_name", MODELS)
@pytest.mark.parametrize(
    "overrides",
    [
        {},
        {"genre_override_ids": None, "style_override_ids": None},
        {"genre_override_ids": [], "style_override_ids": []},
        {"genre_override_ids": [ID], "style_override_ids": [ID]},
    ],
)
def test_generated_album_round_trip(module_name, class_name, overrides):
    model = getattr(import_module(f"groovenet_client.models.{module_name}"), class_name)
    payload = {"release_id": "same-release", "friend_id": 7, **overrides}
    if module_name != "update_album_body":
        payload.update(
            title="Album",
            artist="Artist",
            genres=["Latin"],
            styles=["Cumbia"],
            effective_genres=[],
            effective_styles=["Fusion"],
        )
    entity = model.from_dict(payload)
    assert entity.to_dict() == payload
    if overrides.get("genre_override_ids"):
        assert entity.genre_override_ids == [UUID(ID)]
    # Wire optional values also remain absent when not reported by an older server.
    minimal = {"release_id": "r", "friend_id": 7, "title": "Album", "artist": "Artist"}
    if module_name == "update_album_body":
        minimal = {"release_id": "r", "friend_id": 7}
    assert model.from_dict(minimal).to_dict() == minimal


@pytest.mark.parametrize("module_name,class_name", MODELS)
@pytest.mark.parametrize("value", [123, {}, ["invalid-uuid"]])
def test_generated_permissive_union_fallback(module_name, class_name, value):
    """Generated union readers preserve unsupported values; API validation rejects writes."""
    model = getattr(import_module(f"groovenet_client.models.{module_name}"), class_name)
    payload = {
        "release_id": "r",
        "friend_id": 7,
        "title": "Album",
        "artist": "Artist",
        "genre_override_ids": value,
        "style_override_ids": value,
    }
    if module_name == "update_album_body":
        payload.pop("title")
        payload.pop("artist")
    assert model.from_dict(payload).to_dict() == payload


@pytest.mark.parametrize("module_name,class_name", MODELS[1:])
@pytest.mark.parametrize("value", [None, 123])
def test_generated_nullable_source_values(module_name, class_name, value):
    model = getattr(import_module(f"groovenet_client.models.{module_name}"), class_name)
    payload = {
        "release_id": "r",
        "friend_id": 7,
        "title": "Album",
        "artist": "Artist",
        "genres": value,
        "styles": value,
    }
    assert model.from_dict(payload).to_dict() == payload
