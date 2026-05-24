from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset







T = TypeVar("T", bound="DeleteApiTracksIdResponse200")



@_attrs_define
class DeleteApiTracksIdResponse200:
    """ 
        Attributes:
            success (bool):
            track_id (str):
            friend_id (int):
     """

    success: bool
    track_id: str
    friend_id: int
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        success = self.success

        track_id = self.track_id

        friend_id = self.friend_id


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "success": success,
            "track_id": track_id,
            "friend_id": friend_id,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        success = d.pop("success")

        track_id = d.pop("track_id")

        friend_id = d.pop("friend_id")

        delete_api_tracks_id_response_200 = cls(
            success=success,
            track_id=track_id,
            friend_id=friend_id,
        )


        delete_api_tracks_id_response_200.additional_properties = d
        return delete_api_tracks_id_response_200

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
