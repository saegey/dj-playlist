from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.get_backup_policy_response_200_policy_provider import GetBackupPolicyResponse200PolicyProvider
from ..models.get_backup_policy_response_200_policy_retention_preset import GetBackupPolicyResponse200PolicyRetentionPreset






T = TypeVar("T", bound="GetBackupPolicyResponse200Policy")



@_attrs_define
class GetBackupPolicyResponse200Policy:
    """ 
        Attributes:
            enabled (bool):
            provider (GetBackupPolicyResponse200PolicyProvider):
            schedule_cron (str):
            retention_preset (GetBackupPolicyResponse200PolicyRetentionPreset):
            include_database (bool):
            include_audio_files (bool):
            include_album_covers (bool):
            include_uploads (bool):
            updated_at (str):
     """

    enabled: bool
    provider: GetBackupPolicyResponse200PolicyProvider
    schedule_cron: str
    retention_preset: GetBackupPolicyResponse200PolicyRetentionPreset
    include_database: bool
    include_audio_files: bool
    include_album_covers: bool
    include_uploads: bool
    updated_at: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        enabled = self.enabled

        provider = self.provider.value

        schedule_cron = self.schedule_cron

        retention_preset = self.retention_preset.value

        include_database = self.include_database

        include_audio_files = self.include_audio_files

        include_album_covers = self.include_album_covers

        include_uploads = self.include_uploads

        updated_at = self.updated_at


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "enabled": enabled,
            "provider": provider,
            "schedule_cron": schedule_cron,
            "retention_preset": retention_preset,
            "include_database": include_database,
            "include_audio_files": include_audio_files,
            "include_album_covers": include_album_covers,
            "include_uploads": include_uploads,
            "updated_at": updated_at,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        enabled = d.pop("enabled")

        provider = GetBackupPolicyResponse200PolicyProvider(d.pop("provider"))




        schedule_cron = d.pop("schedule_cron")

        retention_preset = GetBackupPolicyResponse200PolicyRetentionPreset(d.pop("retention_preset"))




        include_database = d.pop("include_database")

        include_audio_files = d.pop("include_audio_files")

        include_album_covers = d.pop("include_album_covers")

        include_uploads = d.pop("include_uploads")

        updated_at = d.pop("updated_at")

        get_backup_policy_response_200_policy = cls(
            enabled=enabled,
            provider=provider,
            schedule_cron=schedule_cron,
            retention_preset=retention_preset,
            include_database=include_database,
            include_audio_files=include_audio_files,
            include_album_covers=include_album_covers,
            include_uploads=include_uploads,
            updated_at=updated_at,
        )


        get_backup_policy_response_200_policy.additional_properties = d
        return get_backup_policy_response_200_policy

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
