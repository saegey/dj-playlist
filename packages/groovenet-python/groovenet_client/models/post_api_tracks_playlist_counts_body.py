from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast

if TYPE_CHECKING:
  from ..models.post_api_tracks_playlist_counts_body_track_refs_item import PostApiTracksPlaylistCountsBodyTrackRefsItem





T = TypeVar("T", bound="PostApiTracksPlaylistCountsBody")



@_attrs_define
class PostApiTracksPlaylistCountsBody:
    """ 
        Attributes:
            track_refs (list[PostApiTracksPlaylistCountsBodyTrackRefsItem] | Unset):
     """

    track_refs: list[PostApiTracksPlaylistCountsBodyTrackRefsItem] | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.post_api_tracks_playlist_counts_body_track_refs_item import PostApiTracksPlaylistCountsBodyTrackRefsItem
        track_refs: list[dict[str, Any]] | Unset = UNSET
        if not isinstance(self.track_refs, Unset):
            track_refs = []
            for track_refs_item_data in self.track_refs:
                track_refs_item = track_refs_item_data.to_dict()
                track_refs.append(track_refs_item)




        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
        })
        if track_refs is not UNSET:
            field_dict["track_refs"] = track_refs

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.post_api_tracks_playlist_counts_body_track_refs_item import PostApiTracksPlaylistCountsBodyTrackRefsItem
        d = dict(src_dict)
        _track_refs = d.pop("track_refs", UNSET)
        track_refs: list[PostApiTracksPlaylistCountsBodyTrackRefsItem] | Unset = UNSET
        if _track_refs is not UNSET:
            track_refs = []
            for track_refs_item_data in _track_refs:
                track_refs_item = PostApiTracksPlaylistCountsBodyTrackRefsItem.from_dict(track_refs_item_data)



                track_refs.append(track_refs_item)


        post_api_tracks_playlist_counts_body = cls(
            track_refs=track_refs,
        )


        post_api_tracks_playlist_counts_body.additional_properties = d
        return post_api_tracks_playlist_counts_body

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
