from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.get_album_discogs_raw_response_200_data import GetAlbumDiscogsRawResponse200Data





T = TypeVar("T", bound="GetAlbumDiscogsRawResponse200")



@_attrs_define
class GetAlbumDiscogsRawResponse200:
    """ 
        Attributes:
            friend_id (int):
            release_id (str):
            username (str):
            file_path (str):
            data (GetAlbumDiscogsRawResponse200Data):
     """

    friend_id: int
    release_id: str
    username: str
    file_path: str
    data: GetAlbumDiscogsRawResponse200Data
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.get_album_discogs_raw_response_200_data import GetAlbumDiscogsRawResponse200Data
        friend_id = self.friend_id

        release_id = self.release_id

        username = self.username

        file_path = self.file_path

        data = self.data.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "friend_id": friend_id,
            "release_id": release_id,
            "username": username,
            "file_path": file_path,
            "data": data,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.get_album_discogs_raw_response_200_data import GetAlbumDiscogsRawResponse200Data
        d = dict(src_dict)
        friend_id = d.pop("friend_id")

        release_id = d.pop("release_id")

        username = d.pop("username")

        file_path = d.pop("file_path")

        data = GetAlbumDiscogsRawResponse200Data.from_dict(d.pop("data"))




        get_album_discogs_raw_response_200 = cls(
            friend_id=friend_id,
            release_id=release_id,
            username=username,
            file_path=file_path,
            data=data,
        )


        get_album_discogs_raw_response_200.additional_properties = d
        return get_album_discogs_raw_response_200

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
