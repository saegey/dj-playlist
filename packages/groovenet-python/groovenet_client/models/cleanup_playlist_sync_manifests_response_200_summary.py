from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset







T = TypeVar("T", bound="CleanupPlaylistSyncManifestsResponse200Summary")



@_attrs_define
class CleanupPlaylistSyncManifestsResponse200Summary:
    """ 
        Attributes:
            total_manifests (int):
            total_removed (int):
            total_kept (int):
     """

    total_manifests: int
    total_removed: int
    total_kept: int
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        total_manifests = self.total_manifests

        total_removed = self.total_removed

        total_kept = self.total_kept


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "totalManifests": total_manifests,
            "totalRemoved": total_removed,
            "totalKept": total_kept,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        total_manifests = d.pop("totalManifests")

        total_removed = d.pop("totalRemoved")

        total_kept = d.pop("totalKept")

        cleanup_playlist_sync_manifests_response_200_summary = cls(
            total_manifests=total_manifests,
            total_removed=total_removed,
            total_kept=total_kept,
        )


        cleanup_playlist_sync_manifests_response_200_summary.additional_properties = d
        return cleanup_playlist_sync_manifests_response_200_summary

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
