from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset






T = TypeVar("T", bound="SearchProviderAppleMusicResponse200ResultsItem")



@_attrs_define
class SearchProviderAppleMusicResponse200ResultsItem:
    """ 
        Attributes:
            id (str):
            title (str | Unset):
            artist (str | Unset):
            album (str | Unset):
            url (str | Unset):
            artwork (str | Unset):
            duration (float | Unset):
            isrc (str | Unset):
     """

    id: str
    title: str | Unset = UNSET
    artist: str | Unset = UNSET
    album: str | Unset = UNSET
    url: str | Unset = UNSET
    artwork: str | Unset = UNSET
    duration: float | Unset = UNSET
    isrc: str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        id = self.id

        title = self.title

        artist = self.artist

        album = self.album

        url = self.url

        artwork = self.artwork

        duration = self.duration

        isrc = self.isrc


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "id": id,
        })
        if title is not UNSET:
            field_dict["title"] = title
        if artist is not UNSET:
            field_dict["artist"] = artist
        if album is not UNSET:
            field_dict["album"] = album
        if url is not UNSET:
            field_dict["url"] = url
        if artwork is not UNSET:
            field_dict["artwork"] = artwork
        if duration is not UNSET:
            field_dict["duration"] = duration
        if isrc is not UNSET:
            field_dict["isrc"] = isrc

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        id = d.pop("id")

        title = d.pop("title", UNSET)

        artist = d.pop("artist", UNSET)

        album = d.pop("album", UNSET)

        url = d.pop("url", UNSET)

        artwork = d.pop("artwork", UNSET)

        duration = d.pop("duration", UNSET)

        isrc = d.pop("isrc", UNSET)

        search_provider_apple_music_response_200_results_item = cls(
            id=id,
            title=title,
            artist=artist,
            album=album,
            url=url,
            artwork=artwork,
            duration=duration,
            isrc=isrc,
        )


        search_provider_apple_music_response_200_results_item.additional_properties = d
        return search_provider_apple_music_response_200_results_item

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
