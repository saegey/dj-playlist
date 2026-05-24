from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset







T = TypeVar("T", bound="VerifyPlaylistSyncManifestsResponse200Summary")



@_attrs_define
class VerifyPlaylistSyncManifestsResponse200Summary:
    """ 
        Attributes:
            total_manifests (int):
            total_missing_files (int):
            total_valid_files (int):
     """

    total_manifests: int
    total_missing_files: int
    total_valid_files: int
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        total_manifests = self.total_manifests

        total_missing_files = self.total_missing_files

        total_valid_files = self.total_valid_files


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "totalManifests": total_manifests,
            "totalMissingFiles": total_missing_files,
            "totalValidFiles": total_valid_files,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        total_manifests = d.pop("totalManifests")

        total_missing_files = d.pop("totalMissingFiles")

        total_valid_files = d.pop("totalValidFiles")

        verify_playlist_sync_manifests_response_200_summary = cls(
            total_manifests=total_manifests,
            total_missing_files=total_missing_files,
            total_valid_files=total_valid_files,
        )


        verify_playlist_sync_manifests_response_200_summary.additional_properties = d
        return verify_playlist_sync_manifests_response_200_summary

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
