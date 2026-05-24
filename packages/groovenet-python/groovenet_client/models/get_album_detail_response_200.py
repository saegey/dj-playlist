from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.get_album_detail_response_200_album import GetAlbumDetailResponse200Album
  from ..models.get_album_detail_response_200_tracks_item import GetAlbumDetailResponse200TracksItem





T = TypeVar("T", bound="GetAlbumDetailResponse200")



@_attrs_define
class GetAlbumDetailResponse200:
    """ 
        Attributes:
            album (GetAlbumDetailResponse200Album):
            tracks (list[GetAlbumDetailResponse200TracksItem]):
     """

    album: GetAlbumDetailResponse200Album
    tracks: list[GetAlbumDetailResponse200TracksItem]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.get_album_detail_response_200_album import GetAlbumDetailResponse200Album
        from ..models.get_album_detail_response_200_tracks_item import GetAlbumDetailResponse200TracksItem
        album = self.album.to_dict()

        tracks = []
        for tracks_item_data in self.tracks:
            tracks_item = tracks_item_data.to_dict()
            tracks.append(tracks_item)




        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "album": album,
            "tracks": tracks,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.get_album_detail_response_200_album import GetAlbumDetailResponse200Album
        from ..models.get_album_detail_response_200_tracks_item import GetAlbumDetailResponse200TracksItem
        d = dict(src_dict)
        album = GetAlbumDetailResponse200Album.from_dict(d.pop("album"))




        tracks = []
        _tracks = d.pop("tracks")
        for tracks_item_data in (_tracks):
            tracks_item = GetAlbumDetailResponse200TracksItem.from_dict(tracks_item_data)



            tracks.append(tracks_item)


        get_album_detail_response_200 = cls(
            album=album,
            tracks=tracks,
        )


        get_album_detail_response_200.additional_properties = d
        return get_album_detail_response_200

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
