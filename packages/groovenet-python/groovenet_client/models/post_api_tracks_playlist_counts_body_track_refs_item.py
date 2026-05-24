from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset







T = TypeVar("T", bound="PostApiTracksPlaylistCountsBodyTrackRefsItem")



@_attrs_define
class PostApiTracksPlaylistCountsBodyTrackRefsItem:
    """ 
        Attributes:
            track_id (str):
            friend_id (int):
     """

    track_id: str
    friend_id: int
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        track_id = self.track_id

        friend_id = self.friend_id


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "track_id": track_id,
            "friend_id": friend_id,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        track_id = d.pop("track_id")

        friend_id = d.pop("friend_id")

        post_api_tracks_playlist_counts_body_track_refs_item = cls(
            track_id=track_id,
            friend_id=friend_id,
        )


        post_api_tracks_playlist_counts_body_track_refs_item.additional_properties = d
        return post_api_tracks_playlist_counts_body_track_refs_item

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
