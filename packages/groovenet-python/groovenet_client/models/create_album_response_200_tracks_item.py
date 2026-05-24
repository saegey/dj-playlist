from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast






T = TypeVar("T", bound="CreateAlbumResponse200TracksItem")



@_attrs_define
class CreateAlbumResponse200TracksItem:
    """ 
        Attributes:
            track_id (str):
            friend_id (int):
            title (str):
            artist (str):
            album (str):
            year (float | None | str | Unset):
            duration (str | Unset):
            duration_seconds (float | None | Unset):
            position (float | str | Unset):
            release_id (None | str | Unset):
            library_identifier (None | str | Unset):
     """

    track_id: str
    friend_id: int
    title: str
    artist: str
    album: str
    year: float | None | str | Unset = UNSET
    duration: str | Unset = UNSET
    duration_seconds: float | None | Unset = UNSET
    position: float | str | Unset = UNSET
    release_id: None | str | Unset = UNSET
    library_identifier: None | str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        track_id = self.track_id

        friend_id = self.friend_id

        title = self.title

        artist = self.artist

        album = self.album

        year: float | None | str | Unset
        if isinstance(self.year, Unset):
            year = UNSET
        else:
            year = self.year

        duration = self.duration

        duration_seconds: float | None | Unset
        if isinstance(self.duration_seconds, Unset):
            duration_seconds = UNSET
        else:
            duration_seconds = self.duration_seconds

        position: float | str | Unset
        if isinstance(self.position, Unset):
            position = UNSET
        else:
            position = self.position

        release_id: None | str | Unset
        if isinstance(self.release_id, Unset):
            release_id = UNSET
        else:
            release_id = self.release_id

        library_identifier: None | str | Unset
        if isinstance(self.library_identifier, Unset):
            library_identifier = UNSET
        else:
            library_identifier = self.library_identifier


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "track_id": track_id,
            "friend_id": friend_id,
            "title": title,
            "artist": artist,
            "album": album,
        })
        if year is not UNSET:
            field_dict["year"] = year
        if duration is not UNSET:
            field_dict["duration"] = duration
        if duration_seconds is not UNSET:
            field_dict["duration_seconds"] = duration_seconds
        if position is not UNSET:
            field_dict["position"] = position
        if release_id is not UNSET:
            field_dict["release_id"] = release_id
        if library_identifier is not UNSET:
            field_dict["library_identifier"] = library_identifier

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        track_id = d.pop("track_id")

        friend_id = d.pop("friend_id")

        title = d.pop("title")

        artist = d.pop("artist")

        album = d.pop("album")

        def _parse_year(data: object) -> float | None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(float | None | str | Unset, data)

        year = _parse_year(d.pop("year", UNSET))


        duration = d.pop("duration", UNSET)

        def _parse_duration_seconds(data: object) -> float | None | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(float | None | Unset, data)

        duration_seconds = _parse_duration_seconds(d.pop("duration_seconds", UNSET))


        def _parse_position(data: object) -> float | str | Unset:
            if isinstance(data, Unset):
                return data
            return cast(float | str | Unset, data)

        position = _parse_position(d.pop("position", UNSET))


        def _parse_release_id(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        release_id = _parse_release_id(d.pop("release_id", UNSET))


        def _parse_library_identifier(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        library_identifier = _parse_library_identifier(d.pop("library_identifier", UNSET))


        create_album_response_200_tracks_item = cls(
            track_id=track_id,
            friend_id=friend_id,
            title=title,
            artist=artist,
            album=album,
            year=year,
            duration=duration,
            duration_seconds=duration_seconds,
            position=position,
            release_id=release_id,
            library_identifier=library_identifier,
        )


        create_album_response_200_tracks_item.additional_properties = d
        return create_album_response_200_tracks_item

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
