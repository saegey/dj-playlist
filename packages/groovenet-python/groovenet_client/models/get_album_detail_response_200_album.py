from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast
from uuid import UUID






T = TypeVar("T", bound="GetAlbumDetailResponse200Album")



@_attrs_define
class GetAlbumDetailResponse200Album:
    """ 
        Attributes:
            release_id (str):
            friend_id (int):
            title (str):
            artist (str):
            genres (list[str] | None | Unset): Imported Discogs source genres.
            styles (list[str] | None | Unset): Imported Discogs source styles.
            effective_genres (list[str] | Unset):
            effective_styles (list[str] | Unset):
            genre_override_ids (list[UUID] | None | Unset): Omitted: unchanged; null: reset to latest Discogs; []:
                deliberately empty replacement.
            style_override_ids (list[UUID] | None | Unset): Omitted: unchanged; null: reset to latest Discogs; []:
                deliberately empty replacement.
     """

    release_id: str
    friend_id: int
    title: str
    artist: str
    genres: list[str] | None | Unset = UNSET
    styles: list[str] | None | Unset = UNSET
    effective_genres: list[str] | Unset = UNSET
    effective_styles: list[str] | Unset = UNSET
    genre_override_ids: list[UUID] | None | Unset = UNSET
    style_override_ids: list[UUID] | None | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        release_id = self.release_id

        friend_id = self.friend_id

        title = self.title

        artist = self.artist

        genres: list[str] | None | Unset
        if isinstance(self.genres, Unset):
            genres = UNSET
        elif isinstance(self.genres, list):
            genres = self.genres


        else:
            genres = self.genres

        styles: list[str] | None | Unset
        if isinstance(self.styles, Unset):
            styles = UNSET
        elif isinstance(self.styles, list):
            styles = self.styles


        else:
            styles = self.styles

        effective_genres: list[str] | Unset = UNSET
        if not isinstance(self.effective_genres, Unset):
            effective_genres = self.effective_genres



        effective_styles: list[str] | Unset = UNSET
        if not isinstance(self.effective_styles, Unset):
            effective_styles = self.effective_styles



        genre_override_ids: list[str] | None | Unset
        if isinstance(self.genre_override_ids, Unset):
            genre_override_ids = UNSET
        elif isinstance(self.genre_override_ids, list):
            genre_override_ids = []
            for genre_override_ids_type_0_item_data in self.genre_override_ids:
                genre_override_ids_type_0_item = str(genre_override_ids_type_0_item_data)
                genre_override_ids.append(genre_override_ids_type_0_item)


        else:
            genre_override_ids = self.genre_override_ids

        style_override_ids: list[str] | None | Unset
        if isinstance(self.style_override_ids, Unset):
            style_override_ids = UNSET
        elif isinstance(self.style_override_ids, list):
            style_override_ids = []
            for style_override_ids_type_0_item_data in self.style_override_ids:
                style_override_ids_type_0_item = str(style_override_ids_type_0_item_data)
                style_override_ids.append(style_override_ids_type_0_item)


        else:
            style_override_ids = self.style_override_ids


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "release_id": release_id,
            "friend_id": friend_id,
            "title": title,
            "artist": artist,
        })
        if genres is not UNSET:
            field_dict["genres"] = genres
        if styles is not UNSET:
            field_dict["styles"] = styles
        if effective_genres is not UNSET:
            field_dict["effective_genres"] = effective_genres
        if effective_styles is not UNSET:
            field_dict["effective_styles"] = effective_styles
        if genre_override_ids is not UNSET:
            field_dict["genre_override_ids"] = genre_override_ids
        if style_override_ids is not UNSET:
            field_dict["style_override_ids"] = style_override_ids

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        release_id = d.pop("release_id")

        friend_id = d.pop("friend_id")

        title = d.pop("title")

        artist = d.pop("artist")

        def _parse_genres(data: object) -> list[str] | None | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            try:
                if not isinstance(data, list):
                    raise TypeError()
                genres_type_0 = cast(list[str], data)

                return genres_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(list[str] | None | Unset, data)

        genres = _parse_genres(d.pop("genres", UNSET))


        def _parse_styles(data: object) -> list[str] | None | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            try:
                if not isinstance(data, list):
                    raise TypeError()
                styles_type_0 = cast(list[str], data)

                return styles_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(list[str] | None | Unset, data)

        styles = _parse_styles(d.pop("styles", UNSET))


        effective_genres = cast(list[str], d.pop("effective_genres", UNSET))


        effective_styles = cast(list[str], d.pop("effective_styles", UNSET))


        def _parse_genre_override_ids(data: object) -> list[UUID] | None | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            try:
                if not isinstance(data, list):
                    raise TypeError()
                genre_override_ids_type_0 = []
                _genre_override_ids_type_0 = data
                for genre_override_ids_type_0_item_data in (_genre_override_ids_type_0):
                    genre_override_ids_type_0_item = UUID(genre_override_ids_type_0_item_data)



                    genre_override_ids_type_0.append(genre_override_ids_type_0_item)

                return genre_override_ids_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(list[UUID] | None | Unset, data)

        genre_override_ids = _parse_genre_override_ids(d.pop("genre_override_ids", UNSET))


        def _parse_style_override_ids(data: object) -> list[UUID] | None | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            try:
                if not isinstance(data, list):
                    raise TypeError()
                style_override_ids_type_0 = []
                _style_override_ids_type_0 = data
                for style_override_ids_type_0_item_data in (_style_override_ids_type_0):
                    style_override_ids_type_0_item = UUID(style_override_ids_type_0_item_data)



                    style_override_ids_type_0.append(style_override_ids_type_0_item)

                return style_override_ids_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(list[UUID] | None | Unset, data)

        style_override_ids = _parse_style_override_ids(d.pop("style_override_ids", UNSET))


        get_album_detail_response_200_album = cls(
            release_id=release_id,
            friend_id=friend_id,
            title=title,
            artist=artist,
            genres=genres,
            styles=styles,
            effective_genres=effective_genres,
            effective_styles=effective_styles,
            genre_override_ids=genre_override_ids,
            style_override_ids=style_override_ids,
        )


        get_album_detail_response_200_album.additional_properties = d
        return get_album_detail_response_200_album

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
