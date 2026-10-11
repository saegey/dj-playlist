from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast
from uuid import UUID






T = TypeVar("T", bound="UpdateAlbumBody")



@_attrs_define
class UpdateAlbumBody:
    """ 
        Attributes:
            release_id (str):
            friend_id (int):
            genre_override_ids (list[UUID] | None | Unset): Omitted: unchanged; null: reset to latest Discogs; []:
                deliberately empty replacement.
            style_override_ids (list[UUID] | None | Unset): Omitted: unchanged; null: reset to latest Discogs; []:
                deliberately empty replacement.
            album_rating (float | Unset):
            album_notes (str | Unset):
            purchase_price (float | Unset):
            condition (str | Unset):
            library_identifier (None | str | Unset):
     """

    release_id: str
    friend_id: int
    genre_override_ids: list[UUID] | None | Unset = UNSET
    style_override_ids: list[UUID] | None | Unset = UNSET
    album_rating: float | Unset = UNSET
    album_notes: str | Unset = UNSET
    purchase_price: float | Unset = UNSET
    condition: str | Unset = UNSET
    library_identifier: None | str | Unset = UNSET





    def to_dict(self) -> dict[str, Any]:
        release_id = self.release_id

        friend_id = self.friend_id

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

        album_rating = self.album_rating

        album_notes = self.album_notes

        purchase_price = self.purchase_price

        condition = self.condition

        library_identifier: None | str | Unset
        if isinstance(self.library_identifier, Unset):
            library_identifier = UNSET
        else:
            library_identifier = self.library_identifier


        field_dict: dict[str, Any] = {}

        field_dict.update({
            "release_id": release_id,
            "friend_id": friend_id,
        })
        if genre_override_ids is not UNSET:
            field_dict["genre_override_ids"] = genre_override_ids
        if style_override_ids is not UNSET:
            field_dict["style_override_ids"] = style_override_ids
        if album_rating is not UNSET:
            field_dict["album_rating"] = album_rating
        if album_notes is not UNSET:
            field_dict["album_notes"] = album_notes
        if purchase_price is not UNSET:
            field_dict["purchase_price"] = purchase_price
        if condition is not UNSET:
            field_dict["condition"] = condition
        if library_identifier is not UNSET:
            field_dict["library_identifier"] = library_identifier

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        release_id = d.pop("release_id")

        friend_id = d.pop("friend_id")

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


        album_rating = d.pop("album_rating", UNSET)

        album_notes = d.pop("album_notes", UNSET)

        purchase_price = d.pop("purchase_price", UNSET)

        condition = d.pop("condition", UNSET)

        def _parse_library_identifier(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        library_identifier = _parse_library_identifier(d.pop("library_identifier", UNSET))


        update_album_body = cls(
            release_id=release_id,
            friend_id=friend_id,
            genre_override_ids=genre_override_ids,
            style_override_ids=style_override_ids,
            album_rating=album_rating,
            album_notes=album_notes,
            purchase_price=purchase_price,
            condition=condition,
            library_identifier=library_identifier,
        )

        return update_album_body

