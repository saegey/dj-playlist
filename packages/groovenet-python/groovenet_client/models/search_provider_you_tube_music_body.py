from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset






T = TypeVar("T", bound="SearchProviderYouTubeMusicBody")



@_attrs_define
class SearchProviderYouTubeMusicBody:
    """ 
        Attributes:
            title (str | Unset):
            artist (str | Unset):
     """

    title: str | Unset = UNSET
    artist: str | Unset = UNSET





    def to_dict(self) -> dict[str, Any]:
        title = self.title

        artist = self.artist


        field_dict: dict[str, Any] = {}

        field_dict.update({
        })
        if title is not UNSET:
            field_dict["title"] = title
        if artist is not UNSET:
            field_dict["artist"] = artist

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        title = d.pop("title", UNSET)

        artist = d.pop("artist", UNSET)

        search_provider_you_tube_music_body = cls(
            title=title,
            artist=artist,
        )

        return search_provider_you_tube_music_body

