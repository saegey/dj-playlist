from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.upsert_album_with_tracks_response_200_album import UpsertAlbumWithTracksResponse200Album
  from ..models.upsert_album_with_tracks_response_200_tracks_item import UpsertAlbumWithTracksResponse200TracksItem





T = TypeVar("T", bound="UpsertAlbumWithTracksResponse200")



@_attrs_define
class UpsertAlbumWithTracksResponse200:
    """ 
        Attributes:
            album (UpsertAlbumWithTracksResponse200Album):
            tracks (list[UpsertAlbumWithTracksResponse200TracksItem]):
            deleted_tracks (int):
     """

    album: UpsertAlbumWithTracksResponse200Album
    tracks: list[UpsertAlbumWithTracksResponse200TracksItem]
    deleted_tracks: int
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.upsert_album_with_tracks_response_200_album import UpsertAlbumWithTracksResponse200Album
        from ..models.upsert_album_with_tracks_response_200_tracks_item import UpsertAlbumWithTracksResponse200TracksItem
        album = self.album.to_dict()

        tracks = []
        for tracks_item_data in self.tracks:
            tracks_item = tracks_item_data.to_dict()
            tracks.append(tracks_item)



        deleted_tracks = self.deleted_tracks


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "album": album,
            "tracks": tracks,
            "deletedTracks": deleted_tracks,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.upsert_album_with_tracks_response_200_album import UpsertAlbumWithTracksResponse200Album
        from ..models.upsert_album_with_tracks_response_200_tracks_item import UpsertAlbumWithTracksResponse200TracksItem
        d = dict(src_dict)
        album = UpsertAlbumWithTracksResponse200Album.from_dict(d.pop("album"))




        tracks = []
        _tracks = d.pop("tracks")
        for tracks_item_data in (_tracks):
            tracks_item = UpsertAlbumWithTracksResponse200TracksItem.from_dict(tracks_item_data)



            tracks.append(tracks_item)


        deleted_tracks = d.pop("deletedTracks")

        upsert_album_with_tracks_response_200 = cls(
            album=album,
            tracks=tracks,
            deleted_tracks=deleted_tracks,
        )


        upsert_album_with_tracks_response_200.additional_properties = d
        return upsert_album_with_tracks_response_200

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
