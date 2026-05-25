from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset






T = TypeVar("T", bound="CreatePlaylistResponse201TracksItem")



@_attrs_define
class CreatePlaylistResponse201TracksItem:
    """ 
        Attributes:
            track_id (str):
            friend_id (int):
            position (int | Unset):
     """

    track_id: str
    friend_id: int
    position: int | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        track_id = self.track_id

        friend_id = self.friend_id

        position = self.position


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "track_id": track_id,
            "friend_id": friend_id,
        })
        if position is not UNSET:
            field_dict["position"] = position

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        track_id = d.pop("track_id")

        friend_id = d.pop("friend_id")

        position = d.pop("position", UNSET)

        create_playlist_response_201_tracks_item = cls(
            track_id=track_id,
            friend_id=friend_id,
            position=position,
        )


        create_playlist_response_201_tracks_item.additional_properties = d
        return create_playlist_response_201_tracks_item

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
