from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast

if TYPE_CHECKING:
  from ..models.update_playlist_body_tracks_item_type_1 import UpdatePlaylistBodyTracksItemType1





T = TypeVar("T", bound="UpdatePlaylistBody")



@_attrs_define
class UpdatePlaylistBody:
    """ 
        Attributes:
            id (int):
            name (str | Unset):
            tracks (list[str | UpdatePlaylistBodyTracksItemType1] | Unset):
            default_friend_id (int | Unset):
     """

    id: int
    name: str | Unset = UNSET
    tracks: list[str | UpdatePlaylistBodyTracksItemType1] | Unset = UNSET
    default_friend_id: int | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.update_playlist_body_tracks_item_type_1 import UpdatePlaylistBodyTracksItemType1
        id = self.id

        name = self.name

        tracks: list[dict[str, Any] | str] | Unset = UNSET
        if not isinstance(self.tracks, Unset):
            tracks = []
            for tracks_item_data in self.tracks:
                tracks_item: dict[str, Any] | str
                if isinstance(tracks_item_data, UpdatePlaylistBodyTracksItemType1):
                    tracks_item = tracks_item_data.to_dict()
                else:
                    tracks_item = tracks_item_data
                tracks.append(tracks_item)



        default_friend_id = self.default_friend_id


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "id": id,
        })
        if name is not UNSET:
            field_dict["name"] = name
        if tracks is not UNSET:
            field_dict["tracks"] = tracks
        if default_friend_id is not UNSET:
            field_dict["default_friend_id"] = default_friend_id

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.update_playlist_body_tracks_item_type_1 import UpdatePlaylistBodyTracksItemType1
        d = dict(src_dict)
        id = d.pop("id")

        name = d.pop("name", UNSET)

        _tracks = d.pop("tracks", UNSET)
        tracks: list[str | UpdatePlaylistBodyTracksItemType1] | Unset = UNSET
        if _tracks is not UNSET:
            tracks = []
            for tracks_item_data in _tracks:
                def _parse_tracks_item(data: object) -> str | UpdatePlaylistBodyTracksItemType1:
                    try:
                        if not isinstance(data, dict):
                            raise TypeError()
                        tracks_item_type_1 = UpdatePlaylistBodyTracksItemType1.from_dict(data)



                        return tracks_item_type_1
                    except (TypeError, ValueError, AttributeError, KeyError):
                        pass
                    return cast(str | UpdatePlaylistBodyTracksItemType1, data)

                tracks_item = _parse_tracks_item(tracks_item_data)

                tracks.append(tracks_item)


        default_friend_id = d.pop("default_friend_id", UNSET)

        update_playlist_body = cls(
            id=id,
            name=name,
            tracks=tracks,
            default_friend_id=default_friend_id,
        )


        update_playlist_body.additional_properties = d
        return update_playlist_body

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
