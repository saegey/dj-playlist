from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast

if TYPE_CHECKING:
  from ..models.get_playlist_tracks_response_200_tracks_item import GetPlaylistTracksResponse200TracksItem





T = TypeVar("T", bound="GetPlaylistTracksResponse200")



@_attrs_define
class GetPlaylistTracksResponse200:
    """ 
        Attributes:
            playlist_id (int):
            tracks (list[GetPlaylistTracksResponse200TracksItem]):
            playlist_name (None | str | Unset):
     """

    playlist_id: int
    tracks: list[GetPlaylistTracksResponse200TracksItem]
    playlist_name: None | str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.get_playlist_tracks_response_200_tracks_item import GetPlaylistTracksResponse200TracksItem
        playlist_id = self.playlist_id

        tracks = []
        for tracks_item_data in self.tracks:
            tracks_item = tracks_item_data.to_dict()
            tracks.append(tracks_item)



        playlist_name: None | str | Unset
        if isinstance(self.playlist_name, Unset):
            playlist_name = UNSET
        else:
            playlist_name = self.playlist_name


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "playlist_id": playlist_id,
            "tracks": tracks,
        })
        if playlist_name is not UNSET:
            field_dict["playlist_name"] = playlist_name

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.get_playlist_tracks_response_200_tracks_item import GetPlaylistTracksResponse200TracksItem
        d = dict(src_dict)
        playlist_id = d.pop("playlist_id")

        tracks = []
        _tracks = d.pop("tracks")
        for tracks_item_data in (_tracks):
            tracks_item = GetPlaylistTracksResponse200TracksItem.from_dict(tracks_item_data)



            tracks.append(tracks_item)


        def _parse_playlist_name(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        playlist_name = _parse_playlist_name(d.pop("playlist_name", UNSET))


        get_playlist_tracks_response_200 = cls(
            playlist_id=playlist_id,
            tracks=tracks,
            playlist_name=playlist_name,
        )


        get_playlist_tracks_response_200.additional_properties = d
        return get_playlist_tracks_response_200

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
