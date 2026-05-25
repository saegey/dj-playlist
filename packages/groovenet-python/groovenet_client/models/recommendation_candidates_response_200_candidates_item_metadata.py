from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast






T = TypeVar("T", bound="RecommendationCandidatesResponse200CandidatesItemMetadata")



@_attrs_define
class RecommendationCandidatesResponse200CandidatesItemMetadata:
    """ 
        Attributes:
            title (str | Unset):
            artist (str | Unset):
            album (str | Unset):
            bpm (float | None | Unset):
            key (None | str | Unset):
            genres (list[str] | Unset):
            styles (list[str] | Unset):
     """

    title: str | Unset = UNSET
    artist: str | Unset = UNSET
    album: str | Unset = UNSET
    bpm: float | None | Unset = UNSET
    key: None | str | Unset = UNSET
    genres: list[str] | Unset = UNSET
    styles: list[str] | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        title = self.title

        artist = self.artist

        album = self.album

        bpm: float | None | Unset
        if isinstance(self.bpm, Unset):
            bpm = UNSET
        else:
            bpm = self.bpm

        key: None | str | Unset
        if isinstance(self.key, Unset):
            key = UNSET
        else:
            key = self.key

        genres: list[str] | Unset = UNSET
        if not isinstance(self.genres, Unset):
            genres = self.genres



        styles: list[str] | Unset = UNSET
        if not isinstance(self.styles, Unset):
            styles = self.styles




        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
        })
        if title is not UNSET:
            field_dict["title"] = title
        if artist is not UNSET:
            field_dict["artist"] = artist
        if album is not UNSET:
            field_dict["album"] = album
        if bpm is not UNSET:
            field_dict["bpm"] = bpm
        if key is not UNSET:
            field_dict["key"] = key
        if genres is not UNSET:
            field_dict["genres"] = genres
        if styles is not UNSET:
            field_dict["styles"] = styles

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        title = d.pop("title", UNSET)

        artist = d.pop("artist", UNSET)

        album = d.pop("album", UNSET)

        def _parse_bpm(data: object) -> float | None | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(float | None | Unset, data)

        bpm = _parse_bpm(d.pop("bpm", UNSET))


        def _parse_key(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        key = _parse_key(d.pop("key", UNSET))


        genres = cast(list[str], d.pop("genres", UNSET))


        styles = cast(list[str], d.pop("styles", UNSET))


        recommendation_candidates_response_200_candidates_item_metadata = cls(
            title=title,
            artist=artist,
            album=album,
            bpm=bpm,
            key=key,
            genres=genres,
            styles=styles,
        )


        recommendation_candidates_response_200_candidates_item_metadata.additional_properties = d
        return recommendation_candidates_response_200_candidates_item_metadata

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
