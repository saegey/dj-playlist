from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast






T = TypeVar("T", bound="SearchTracksQueryResponse200HitsItem")



@_attrs_define
class SearchTracksQueryResponse200HitsItem:
    """ 
        Attributes:
            track_id (str):
            friend_id (int):
            id (int | Unset):
            title (str | Unset):
            artist (str | Unset):
            album (str | Unset):
            year (float | None | str | Unset):
            genres (list[str] | Unset):
            styles (list[str] | Unset):
            bpm (float | None | str | Unset):
            key (None | str | Unset):
            notes (None | str | Unset):
            local_tags (None | str | Unset):
            local_audio_url (None | str | Unset):
            audio_file_album_art_url (None | str | Unset):
            library_identifier (None | str | Unset):
     """

    track_id: str
    friend_id: int
    id: int | Unset = UNSET
    title: str | Unset = UNSET
    artist: str | Unset = UNSET
    album: str | Unset = UNSET
    year: float | None | str | Unset = UNSET
    genres: list[str] | Unset = UNSET
    styles: list[str] | Unset = UNSET
    bpm: float | None | str | Unset = UNSET
    key: None | str | Unset = UNSET
    notes: None | str | Unset = UNSET
    local_tags: None | str | Unset = UNSET
    local_audio_url: None | str | Unset = UNSET
    audio_file_album_art_url: None | str | Unset = UNSET
    library_identifier: None | str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        track_id = self.track_id

        friend_id = self.friend_id

        id = self.id

        title = self.title

        artist = self.artist

        album = self.album

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



        bpm: float | None | str | Unset
        if isinstance(self.bpm, Unset):
            bpm = UNSET
        else:
            bpm = self.bpm

        key: None | str | Unset
        if isinstance(self.key, Unset):
            key = UNSET
        else:
            key = self.key

        notes: None | str | Unset
        if isinstance(self.notes, Unset):
            notes = UNSET
        else:
            notes = self.notes

        local_tags: None | str | Unset
        if isinstance(self.local_tags, Unset):
            local_tags = UNSET
        else:
            local_tags = self.local_tags

        local_audio_url: None | str | Unset
        if isinstance(self.local_audio_url, Unset):
            local_audio_url = UNSET
        else:
            local_audio_url = self.local_audio_url

        audio_file_album_art_url: None | str | Unset
        if isinstance(self.audio_file_album_art_url, Unset):
            audio_file_album_art_url = UNSET
        else:
            audio_file_album_art_url = self.audio_file_album_art_url

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
        })
        if id is not UNSET:
            field_dict["id"] = id
        if title is not UNSET:
            field_dict["title"] = title
        if artist is not UNSET:
            field_dict["artist"] = artist
        if album is not UNSET:
            field_dict["album"] = album
        if year is not UNSET:
            field_dict["year"] = year
        if genres is not UNSET:
            field_dict["genres"] = genres
        if styles is not UNSET:
            field_dict["styles"] = styles
        if bpm is not UNSET:
            field_dict["bpm"] = bpm
        if key is not UNSET:
            field_dict["key"] = key
        if notes is not UNSET:
            field_dict["notes"] = notes
        if local_tags is not UNSET:
            field_dict["local_tags"] = local_tags
        if local_audio_url is not UNSET:
            field_dict["local_audio_url"] = local_audio_url
        if audio_file_album_art_url is not UNSET:
            field_dict["audio_file_album_art_url"] = audio_file_album_art_url
        if library_identifier is not UNSET:
            field_dict["library_identifier"] = library_identifier

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        track_id = d.pop("track_id")

        friend_id = d.pop("friend_id")

        id = d.pop("id", UNSET)

        title = d.pop("title", UNSET)

        artist = d.pop("artist", UNSET)

        album = d.pop("album", UNSET)

        def _parse_year(data: object) -> float | None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(float | None | str | Unset, data)

        year = _parse_year(d.pop("year", UNSET))


        genres = cast(list[str], d.pop("genres", UNSET))


        styles = cast(list[str], d.pop("styles", UNSET))


        def _parse_bpm(data: object) -> float | None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(float | None | str | Unset, data)

        bpm = _parse_bpm(d.pop("bpm", UNSET))


        def _parse_key(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        key = _parse_key(d.pop("key", UNSET))


        def _parse_notes(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        notes = _parse_notes(d.pop("notes", UNSET))


        def _parse_local_tags(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        local_tags = _parse_local_tags(d.pop("local_tags", UNSET))


        def _parse_local_audio_url(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        local_audio_url = _parse_local_audio_url(d.pop("local_audio_url", UNSET))


        def _parse_audio_file_album_art_url(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        audio_file_album_art_url = _parse_audio_file_album_art_url(d.pop("audio_file_album_art_url", UNSET))


        def _parse_library_identifier(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        library_identifier = _parse_library_identifier(d.pop("library_identifier", UNSET))


        search_tracks_query_response_200_hits_item = cls(
            track_id=track_id,
            friend_id=friend_id,
            id=id,
            title=title,
            artist=artist,
            album=album,
            year=year,
            genres=genres,
            styles=styles,
            bpm=bpm,
            key=key,
            notes=notes,
            local_tags=local_tags,
            local_audio_url=local_audio_url,
            audio_file_album_art_url=audio_file_album_art_url,
            library_identifier=library_identifier,
        )


        search_tracks_query_response_200_hits_item.additional_properties = d
        return search_tracks_query_response_200_hits_item

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
