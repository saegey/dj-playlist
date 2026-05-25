from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.list_playlists_response_200_item_tracks_item import ListPlaylistsResponse200ItemTracksItem





T = TypeVar("T", bound="ListPlaylistsResponse200Item")



@_attrs_define
class ListPlaylistsResponse200Item:
    """ 
        Attributes:
            id (int):
            name (str):
            created_at (str):
            tracks (list[ListPlaylistsResponse200ItemTracksItem]):
     """

    id: int
    name: str
    created_at: str
    tracks: list[ListPlaylistsResponse200ItemTracksItem]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.list_playlists_response_200_item_tracks_item import ListPlaylistsResponse200ItemTracksItem
        id = self.id

        name = self.name

        created_at = self.created_at

        tracks = []
        for tracks_item_data in self.tracks:
            tracks_item = tracks_item_data.to_dict()
            tracks.append(tracks_item)




        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "id": id,
            "name": name,
            "created_at": created_at,
            "tracks": tracks,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.list_playlists_response_200_item_tracks_item import ListPlaylistsResponse200ItemTracksItem
        d = dict(src_dict)
        id = d.pop("id")

        name = d.pop("name")

        created_at = d.pop("created_at")

        tracks = []
        _tracks = d.pop("tracks")
        for tracks_item_data in (_tracks):
            tracks_item = ListPlaylistsResponse200ItemTracksItem.from_dict(tracks_item_data)



            tracks.append(tracks_item)


        list_playlists_response_200_item = cls(
            id=id,
            name=name,
            created_at=created_at,
            tracks=tracks,
        )


        list_playlists_response_200_item.additional_properties = d
        return list_playlists_response_200_item

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
