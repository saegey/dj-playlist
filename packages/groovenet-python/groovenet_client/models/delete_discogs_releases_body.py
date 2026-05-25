from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast






T = TypeVar("T", bound="DeleteDiscogsReleasesBody")



@_attrs_define
class DeleteDiscogsReleasesBody:
    """ 
        Attributes:
            username (str):
            release_ids (list[str]):
     """

    username: str
    release_ids: list[str]





    def to_dict(self) -> dict[str, Any]:
        username = self.username

        release_ids = self.release_ids




        field_dict: dict[str, Any] = {}

        field_dict.update({
            "username": username,
            "releaseIds": release_ids,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        username = d.pop("username")

        release_ids = cast(list[str], d.pop("releaseIds"))


        delete_discogs_releases_body = cls(
            username=username,
            release_ids=release_ids,
        )

        return delete_discogs_releases_body

