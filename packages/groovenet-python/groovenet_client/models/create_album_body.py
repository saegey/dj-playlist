from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field
import json
from .. import types

from ..types import UNSET, Unset

from ..types import File, FileTypes
from ..types import UNSET, Unset
from io import BytesIO






T = TypeVar("T", bound="CreateAlbumBody")



@_attrs_define
class CreateAlbumBody:
    """ 
        Attributes:
            album (str): JSON stringified album payload
            tracks (str): JSON stringified tracks payload
            friend_id (str):
            cover_art (File | Unset):
     """

    album: str
    tracks: str
    friend_id: str
    cover_art: File | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        album = self.album

        tracks = self.tracks

        friend_id = self.friend_id

        cover_art: FileTypes | Unset = UNSET
        if not isinstance(self.cover_art, Unset):
            cover_art = self.cover_art.to_tuple()



        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "album": album,
            "tracks": tracks,
            "friend_id": friend_id,
        })
        if cover_art is not UNSET:
            field_dict["cover_art"] = cover_art

        return field_dict


    def to_multipart(self) -> types.RequestFiles:
        files: types.RequestFiles = []

        files.append(("album", (None, str(self.album).encode(), "text/plain")))



        files.append(("tracks", (None, str(self.tracks).encode(), "text/plain")))



        files.append(("friend_id", (None, str(self.friend_id).encode(), "text/plain")))



        if not isinstance(self.cover_art, Unset):
            files.append(("cover_art", self.cover_art.to_tuple()))




        for prop_name, prop in self.additional_properties.items():
            files.append((prop_name, (None, str(prop).encode(), "text/plain")))



        return files


    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        album = d.pop("album")

        tracks = d.pop("tracks")

        friend_id = d.pop("friend_id")

        _cover_art = d.pop("cover_art", UNSET)
        cover_art: File | Unset
        if isinstance(_cover_art,  Unset):
            cover_art = UNSET
        else:
            cover_art = File(
             payload = BytesIO(_cover_art)
        )




        create_album_body = cls(
            album=album,
            tracks=tracks,
            friend_id=friend_id,
            cover_art=cover_art,
        )


        create_album_body.additional_properties = d
        return create_album_body

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
