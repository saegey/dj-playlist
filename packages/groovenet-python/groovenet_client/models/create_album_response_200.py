from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.create_album_response_200_album import CreateAlbumResponse200Album
  from ..models.create_album_response_200_tracks_item import CreateAlbumResponse200TracksItem





T = TypeVar("T", bound="CreateAlbumResponse200")



@_attrs_define
class CreateAlbumResponse200:
    """ 
        Attributes:
            album (CreateAlbumResponse200Album):
            tracks (list[CreateAlbumResponse200TracksItem]):
     """

    album: CreateAlbumResponse200Album
    tracks: list[CreateAlbumResponse200TracksItem]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.create_album_response_200_album import CreateAlbumResponse200Album
        from ..models.create_album_response_200_tracks_item import CreateAlbumResponse200TracksItem
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
        from ..models.create_album_response_200_album import CreateAlbumResponse200Album
        from ..models.create_album_response_200_tracks_item import CreateAlbumResponse200TracksItem
        d = dict(src_dict)
        album = CreateAlbumResponse200Album.from_dict(d.pop("album"))




        tracks = []
        _tracks = d.pop("tracks")
        for tracks_item_data in (_tracks):
            tracks_item = CreateAlbumResponse200TracksItem.from_dict(tracks_item_data)



            tracks.append(tracks_item)


        create_album_response_200 = cls(
            album=album,
            tracks=tracks,
        )


        create_album_response_200.additional_properties = d
        return create_album_response_200

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
