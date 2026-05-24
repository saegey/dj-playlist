from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset






T = TypeVar("T", bound="PostApiTracksAnalyzeAsyncBody")



@_attrs_define
class PostApiTracksAnalyzeAsyncBody:
    """ 
        Attributes:
            track_id (str):
            friend_id (int):
            apple_music_url (str | Unset):
            youtube_url (str | Unset):
            soundcloud_url (str | Unset):
            preferred_downloader (str | Unset):
     """

    track_id: str
    friend_id: int
    apple_music_url: str | Unset = UNSET
    youtube_url: str | Unset = UNSET
    soundcloud_url: str | Unset = UNSET
    preferred_downloader: str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        track_id = self.track_id

        friend_id = self.friend_id

        apple_music_url = self.apple_music_url

        youtube_url = self.youtube_url

        soundcloud_url = self.soundcloud_url

        preferred_downloader = self.preferred_downloader


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "track_id": track_id,
            "friend_id": friend_id,
        })
        if apple_music_url is not UNSET:
            field_dict["apple_music_url"] = apple_music_url
        if youtube_url is not UNSET:
            field_dict["youtube_url"] = youtube_url
        if soundcloud_url is not UNSET:
            field_dict["soundcloud_url"] = soundcloud_url
        if preferred_downloader is not UNSET:
            field_dict["preferred_downloader"] = preferred_downloader

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        track_id = d.pop("track_id")

        friend_id = d.pop("friend_id")

        apple_music_url = d.pop("apple_music_url", UNSET)

        youtube_url = d.pop("youtube_url", UNSET)

        soundcloud_url = d.pop("soundcloud_url", UNSET)

        preferred_downloader = d.pop("preferred_downloader", UNSET)

        post_api_tracks_analyze_async_body = cls(
            track_id=track_id,
            friend_id=friend_id,
            apple_music_url=apple_music_url,
            youtube_url=youtube_url,
            soundcloud_url=soundcloud_url,
            preferred_downloader=preferred_downloader,
        )


        post_api_tracks_analyze_async_body.additional_properties = d
        return post_api_tracks_analyze_async_body

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
