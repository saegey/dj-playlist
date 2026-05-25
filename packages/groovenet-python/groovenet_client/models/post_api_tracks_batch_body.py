from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.post_api_tracks_batch_body_tracks_item import PostApiTracksBatchBodyTracksItem





T = TypeVar("T", bound="PostApiTracksBatchBody")



@_attrs_define
class PostApiTracksBatchBody:
    """ 
        Attributes:
            tracks (list[PostApiTracksBatchBodyTracksItem]):
     """

    tracks: list[PostApiTracksBatchBodyTracksItem]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.post_api_tracks_batch_body_tracks_item import PostApiTracksBatchBodyTracksItem
        tracks = []
        for tracks_item_data in self.tracks:
            tracks_item = tracks_item_data.to_dict()
            tracks.append(tracks_item)




        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "tracks": tracks,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.post_api_tracks_batch_body_tracks_item import PostApiTracksBatchBodyTracksItem
        d = dict(src_dict)
        tracks = []
        _tracks = d.pop("tracks")
        for tracks_item_data in (_tracks):
            tracks_item = PostApiTracksBatchBodyTracksItem.from_dict(tracks_item_data)



            tracks.append(tracks_item)


        post_api_tracks_batch_body = cls(
            tracks=tracks,
        )


        post_api_tracks_batch_body.additional_properties = d
        return post_api_tracks_batch_body

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
