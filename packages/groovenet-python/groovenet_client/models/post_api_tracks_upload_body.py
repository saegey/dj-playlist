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






T = TypeVar("T", bound="PostApiTracksUploadBody")



@_attrs_define
class PostApiTracksUploadBody:
    """ 
        Attributes:
            file (File):
            track_id (str):
            friend_id (str | Unset):
     """

    file: File
    track_id: str
    friend_id: str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        file = self.file.to_tuple()


        track_id = self.track_id

        friend_id = self.friend_id


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "file": file,
            "track_id": track_id,
        })
        if friend_id is not UNSET:
            field_dict["friend_id"] = friend_id

        return field_dict


    def to_multipart(self) -> types.RequestFiles:
        files: types.RequestFiles = []

        files.append(("file", self.file.to_tuple()))



        files.append(("track_id", (None, str(self.track_id).encode(), "text/plain")))



        if not isinstance(self.friend_id, Unset):
            files.append(("friend_id", (None, str(self.friend_id).encode(), "text/plain")))




        for prop_name, prop in self.additional_properties.items():
            files.append((prop_name, (None, str(prop).encode(), "text/plain")))



        return files


    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        file = File(
             payload = BytesIO(d.pop("file"))
        )




        track_id = d.pop("track_id")

        friend_id = d.pop("friend_id", UNSET)

        post_api_tracks_upload_body = cls(
            file=file,
            track_id=track_id,
            friend_id=friend_id,
        )


        post_api_tracks_upload_body.additional_properties = d
        return post_api_tracks_upload_body

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
