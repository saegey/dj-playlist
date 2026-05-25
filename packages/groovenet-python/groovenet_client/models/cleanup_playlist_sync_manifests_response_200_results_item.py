from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast






T = TypeVar("T", bound="CleanupPlaylistSyncManifestsResponse200ResultsItem")



@_attrs_define
class CleanupPlaylistSyncManifestsResponse200ResultsItem:
    """ 
        Attributes:
            username (str):
            before (int):
            after (int):
            removed (list[str]):
     """

    username: str
    before: int
    after: int
    removed: list[str]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        username = self.username

        before = self.before

        after = self.after

        removed = self.removed




        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "username": username,
            "before": before,
            "after": after,
            "removed": removed,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        username = d.pop("username")

        before = d.pop("before")

        after = d.pop("after")

        removed = cast(list[str], d.pop("removed"))


        cleanup_playlist_sync_manifests_response_200_results_item = cls(
            username=username,
            before=before,
            after=after,
            removed=removed,
        )


        cleanup_playlist_sync_manifests_response_200_results_item.additional_properties = d
        return cleanup_playlist_sync_manifests_response_200_results_item

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
