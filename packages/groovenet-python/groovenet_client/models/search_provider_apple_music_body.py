from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset






T = TypeVar("T", bound="SearchProviderAppleMusicBody")



@_attrs_define
class SearchProviderAppleMusicBody:
    """ 
        Attributes:
            title (str | Unset):
            artist (str | Unset):
            album (str | Unset):
            isrc (str | Unset):
     """

    title: str | Unset = UNSET
    artist: str | Unset = UNSET
    album: str | Unset = UNSET
    isrc: str | Unset = UNSET





    def to_dict(self) -> dict[str, Any]:
        title = self.title

        artist = self.artist

        album = self.album

        isrc = self.isrc


        field_dict: dict[str, Any] = {}

        field_dict.update({
        })
        if title is not UNSET:
            field_dict["title"] = title
        if artist is not UNSET:
            field_dict["artist"] = artist
        if album is not UNSET:
            field_dict["album"] = album
        if isrc is not UNSET:
            field_dict["isrc"] = isrc

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        title = d.pop("title", UNSET)

        artist = d.pop("artist", UNSET)

        album = d.pop("album", UNSET)

        isrc = d.pop("isrc", UNSET)

        search_provider_apple_music_body = cls(
            title=title,
            artist=artist,
            album=album,
            isrc=isrc,
        )

        return search_provider_apple_music_body

