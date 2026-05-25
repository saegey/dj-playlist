from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.get_api_tracks_id_playlists_response_200_playlists_item import GetApiTracksIdPlaylistsResponse200PlaylistsItem





T = TypeVar("T", bound="GetApiTracksIdPlaylistsResponse200")



@_attrs_define
class GetApiTracksIdPlaylistsResponse200:
    """ 
        Attributes:
            playlists (list[GetApiTracksIdPlaylistsResponse200PlaylistsItem]):
     """

    playlists: list[GetApiTracksIdPlaylistsResponse200PlaylistsItem]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.get_api_tracks_id_playlists_response_200_playlists_item import GetApiTracksIdPlaylistsResponse200PlaylistsItem
        playlists = []
        for playlists_item_data in self.playlists:
            playlists_item = playlists_item_data.to_dict()
            playlists.append(playlists_item)




        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "playlists": playlists,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.get_api_tracks_id_playlists_response_200_playlists_item import GetApiTracksIdPlaylistsResponse200PlaylistsItem
        d = dict(src_dict)
        playlists = []
        _playlists = d.pop("playlists")
        for playlists_item_data in (_playlists):
            playlists_item = GetApiTracksIdPlaylistsResponse200PlaylistsItem.from_dict(playlists_item_data)



            playlists.append(playlists_item)


        get_api_tracks_id_playlists_response_200 = cls(
            playlists=playlists,
        )


        get_api_tracks_id_playlists_response_200.additional_properties = d
        return get_api_tracks_id_playlists_response_200

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
