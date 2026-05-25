from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset






T = TypeVar("T", bound="UpdateGamdlSettingsBody")



@_attrs_define
class UpdateGamdlSettingsBody:
    """ 
        Attributes:
            friend_id (int):
            audio_quality (str | Unset):
            audio_format (str | Unset):
            save_cover (bool | Unset):
            cover_format (str | Unset):
            save_lyrics (bool | Unset):
            lyrics_format (str | Unset):
            overwrite_existing (bool | Unset):
            skip_music_videos (bool | Unset):
            max_retries (int | Unset):
     """

    friend_id: int
    audio_quality: str | Unset = UNSET
    audio_format: str | Unset = UNSET
    save_cover: bool | Unset = UNSET
    cover_format: str | Unset = UNSET
    save_lyrics: bool | Unset = UNSET
    lyrics_format: str | Unset = UNSET
    overwrite_existing: bool | Unset = UNSET
    skip_music_videos: bool | Unset = UNSET
    max_retries: int | Unset = UNSET





    def to_dict(self) -> dict[str, Any]:
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


        field_dict: dict[str, Any] = {}

        field_dict.update({
            "friend_id": friend_id,
        })
        if audio_quality is not UNSET:
            field_dict["audio_quality"] = audio_quality
        if audio_format is not UNSET:
            field_dict["audio_format"] = audio_format
        if save_cover is not UNSET:
            field_dict["save_cover"] = save_cover
        if cover_format is not UNSET:
            field_dict["cover_format"] = cover_format
        if save_lyrics is not UNSET:
            field_dict["save_lyrics"] = save_lyrics
        if lyrics_format is not UNSET:
            field_dict["lyrics_format"] = lyrics_format
        if overwrite_existing is not UNSET:
            field_dict["overwrite_existing"] = overwrite_existing
        if skip_music_videos is not UNSET:
            field_dict["skip_music_videos"] = skip_music_videos
        if max_retries is not UNSET:
            field_dict["max_retries"] = max_retries

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        friend_id = d.pop("friend_id")

        audio_quality = d.pop("audio_quality", UNSET)

        audio_format = d.pop("audio_format", UNSET)

        save_cover = d.pop("save_cover", UNSET)

        cover_format = d.pop("cover_format", UNSET)

        save_lyrics = d.pop("save_lyrics", UNSET)

        lyrics_format = d.pop("lyrics_format", UNSET)

        overwrite_existing = d.pop("overwrite_existing", UNSET)

        skip_music_videos = d.pop("skip_music_videos", UNSET)

        max_retries = d.pop("max_retries", UNSET)

        update_gamdl_settings_body = cls(
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
        )

        return update_gamdl_settings_body

