from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset







T = TypeVar("T", bound="GetGamdlSettingsResponse200Settings")



@_attrs_define
class GetGamdlSettingsResponse200Settings:
    """ 
        Attributes:
            id (int):
            friend_id (int):
            audio_quality (str):
            audio_format (str):
            save_cover (bool):
            cover_format (str):
            save_lyrics (bool):
            lyrics_format (str):
            overwrite_existing (bool):
            skip_music_videos (bool):
            max_retries (int):
            created_at (str):
            updated_at (str):
     """

    id: int
    friend_id: int
    audio_quality: str
    audio_format: str
    save_cover: bool
    cover_format: str
    save_lyrics: bool
    lyrics_format: str
    overwrite_existing: bool
    skip_music_videos: bool
    max_retries: int
    created_at: str
    updated_at: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        id = self.id

        friend_id = self.friend_id

        audio_quality = self.audio_quality

        audio_format = self.audio_format

        save_cover = self.save_cover

        cover_format = self.cover_format

        save_lyrics = self.save_lyrics

        lyrics_format = self.lyrics_format

        overwrite_existing = self.overwrite_existing

        skip_music_videos = self.skip_music_videos

        max_retries = self.max_retries

        created_at = self.created_at

        updated_at = self.updated_at


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "id": id,
            "friend_id": friend_id,
            "audio_quality": audio_quality,
            "audio_format": audio_format,
            "save_cover": save_cover,
            "cover_format": cover_format,
            "save_lyrics": save_lyrics,
            "lyrics_format": lyrics_format,
            "overwrite_existing": overwrite_existing,
            "skip_music_videos": skip_music_videos,
            "max_retries": max_retries,
            "created_at": created_at,
            "updated_at": updated_at,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        id = d.pop("id")

        friend_id = d.pop("friend_id")

        audio_quality = d.pop("audio_quality")

        audio_format = d.pop("audio_format")

        save_cover = d.pop("save_cover")

        cover_format = d.pop("cover_format")

        save_lyrics = d.pop("save_lyrics")

        lyrics_format = d.pop("lyrics_format")

        overwrite_existing = d.pop("overwrite_existing")

        skip_music_videos = d.pop("skip_music_videos")

        max_retries = d.pop("max_retries")

        created_at = d.pop("created_at")

        updated_at = d.pop("updated_at")

        get_gamdl_settings_response_200_settings = cls(
            id=id,
            friend_id=friend_id,
            audio_quality=audio_quality,
            audio_format=audio_format,
            save_cover=save_cover,
            cover_format=cover_format,
            save_lyrics=save_lyrics,
            lyrics_format=lyrics_format,
            overwrite_existing=overwrite_existing,
            skip_music_videos=skip_music_videos,
            max_retries=max_retries,
            created_at=created_at,
            updated_at=updated_at,
        )


        get_gamdl_settings_response_200_settings.additional_properties = d
        return get_gamdl_settings_response_200_settings

    @property
    def additional_keys(self) -> list[str]:
        return list(self.additional_properties.keys())

    def __getitem__(self, key: str) -> Any:
        return self.additional_properties[key]

    def __setitem__(self, key: str, value: Any) -> None:
        self.additional_properties[key] = value

    def __delitem__(self, key: str) -> None:
        del self.additional_properties[key]

    def __contains__(self, key: str) -> bool:
        return key in self.additional_properties
