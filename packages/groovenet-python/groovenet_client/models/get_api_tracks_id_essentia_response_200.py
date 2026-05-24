from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.get_api_tracks_id_essentia_response_200_data import GetApiTracksIdEssentiaResponse200Data





T = TypeVar("T", bound="GetApiTracksIdEssentiaResponse200")



@_attrs_define
class GetApiTracksIdEssentiaResponse200:
    """ 
        Attributes:
            track_id (str):
            friend_id (int):
            file_path (str):
            data (GetApiTracksIdEssentiaResponse200Data):
     """

    track_id: str
    friend_id: int
    file_path: str
    data: GetApiTracksIdEssentiaResponse200Data
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.get_api_tracks_id_essentia_response_200_data import GetApiTracksIdEssentiaResponse200Data
        track_id = self.track_id

        friend_id = self.friend_id

        file_path = self.file_path

        data = self.data.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "track_id": track_id,
            "friend_id": friend_id,
            "file_path": file_path,
            "data": data,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.get_api_tracks_id_essentia_response_200_data import GetApiTracksIdEssentiaResponse200Data
        d = dict(src_dict)
        track_id = d.pop("track_id")

        friend_id = d.pop("friend_id")

        file_path = d.pop("file_path")

        data = GetApiTracksIdEssentiaResponse200Data.from_dict(d.pop("data"))




        get_api_tracks_id_essentia_response_200 = cls(
            track_id=track_id,
            friend_id=friend_id,
            file_path=file_path,
            data=data,
        )


        get_api_tracks_id_essentia_response_200.additional_properties = d
        return get_api_tracks_id_essentia_response_200

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
