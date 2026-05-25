from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast






T = TypeVar("T", bound="CreateAlbumResponse200Album")



@_attrs_define
class CreateAlbumResponse200Album:
    """ 
        Attributes:
            release_id (str):
            friend_id (int):
            title (str):
            artist (str):
            year (float | None | str | Unset):
            genres (list[str] | Unset):
            styles (list[str] | Unset):
            album_thumbnail (None | str | Unset):
            track_count (int | Unset):
            date_added (str | Unset):
            date_changed (str | Unset):
            library_identifier (None | str | Unset):
     """

    release_id: str
    friend_id: int
    title: str
    artist: str
    year: float | None | str | Unset = UNSET
    genres: list[str] | Unset = UNSET
    styles: list[str] | Unset = UNSET
    album_thumbnail: None | str | Unset = UNSET
    track_count: int | Unset = UNSET
    date_added: str | Unset = UNSET
    date_changed: str | Unset = UNSET
    library_identifier: None | str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        release_id = self.release_id

        friend_id = self.friend_id

        title = self.title

        artist = self.artist

        year: float | None | str | Unset
        if isinstance(self.year, Unset):
            year = UNSET
        else:
            year = self.year

        genres: list[str] | Unset = UNSET
        if not isinstance(self.genres, Unset):
            genres = self.genres



        styles: list[str] | Unset = UNSET
        if not isinstance(self.styles, Unset):
            styles = self.styles



        album_thumbnail: None | str | Unset
        if isinstance(self.album_thumbnail, Unset):
            album_thumbnail = UNSET
        else:
            album_thumbnail = self.album_thumbnail

        track_count = self.track_count

        date_added = self.date_added

        date_changed = self.date_changed

        library_identifier: None | str | Unset
        if isinstance(self.library_identifier, Unset):
            library_identifier = UNSET
        else:
            library_identifier = self.library_identifier


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "release_id": release_id,
            "friend_id": friend_id,
            "title": title,
            "artist": artist,
        })
        if year is not UNSET:
            field_dict["year"] = year
        if genres is not UNSET:
            field_dict["genres"] = genres
        if styles is not UNSET:
            field_dict["styles"] = styles
        if album_thumbnail is not UNSET:
            field_dict["album_thumbnail"] = album_thumbnail
        if track_count is not UNSET:
            field_dict["track_count"] = track_count
        if date_added is not UNSET:
            field_dict["date_added"] = date_added
        if date_changed is not UNSET:
            field_dict["date_changed"] = date_changed
        if library_identifier is not UNSET:
            field_dict["library_identifier"] = library_identifier

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        release_id = d.pop("release_id")

        friend_id = d.pop("friend_id")

        title = d.pop("title")

        artist = d.pop("artist")

        def _parse_year(data: object) -> float | None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(float | None | str | Unset, data)

        year = _parse_year(d.pop("year", UNSET))


        genres = cast(list[str], d.pop("genres", UNSET))


        styles = cast(list[str], d.pop("styles", UNSET))


        def _parse_album_thumbnail(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        album_thumbnail = _parse_album_thumbnail(d.pop("album_thumbnail", UNSET))


        track_count = d.pop("track_count", UNSET)

        date_added = d.pop("date_added", UNSET)

        date_changed = d.pop("date_changed", UNSET)

        def _parse_library_identifier(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        library_identifier = _parse_library_identifier(d.pop("library_identifier", UNSET))


        create_album_response_200_album = cls(
            release_id=release_id,
            friend_id=friend_id,
            title=title,
            artist=artist,
            year=year,
            genres=genres,
            styles=styles,
            album_thumbnail=album_thumbnail,
            track_count=track_count,
            date_added=date_added,
            date_changed=date_changed,
            library_identifier=library_identifier,
        )


        create_album_response_200_album.additional_properties = d
        return create_album_response_200_album

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
