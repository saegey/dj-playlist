from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.update_backup_policy_body_provider import UpdateBackupPolicyBodyProvider
from ..models.update_backup_policy_body_retention_preset import UpdateBackupPolicyBodyRetentionPreset
from ..types import UNSET, Unset






T = TypeVar("T", bound="UpdateBackupPolicyBody")



@_attrs_define
class UpdateBackupPolicyBody:
    """ 
        Attributes:
            enabled (bool | Unset):
            provider (UpdateBackupPolicyBodyProvider | Unset):
            schedule_cron (str | Unset):
            retention_preset (UpdateBackupPolicyBodyRetentionPreset | Unset):
            include_database (bool | Unset):
            include_audio_files (bool | Unset):
            include_album_covers (bool | Unset):
            include_uploads (bool | Unset):
     """

    enabled: bool | Unset = UNSET
    provider: UpdateBackupPolicyBodyProvider | Unset = UNSET
    schedule_cron: str | Unset = UNSET
    retention_preset: UpdateBackupPolicyBodyRetentionPreset | Unset = UNSET
    include_database: bool | Unset = UNSET
    include_audio_files: bool | Unset = UNSET
    include_album_covers: bool | Unset = UNSET
    include_uploads: bool | Unset = UNSET





    def to_dict(self) -> dict[str, Any]:
        enabled = self.enabled

        provider: str | Unset = UNSET
        if not isinstance(self.provider, Unset):
            provider = self.provider.value


        schedule_cron = self.schedule_cron

        retention_preset: str | Unset = UNSET
        if not isinstance(self.retention_preset, Unset):
            retention_preset = self.retention_preset.value


        include_database = self.include_database

        include_audio_files = self.include_audio_files

        include_album_covers = self.include_album_covers

        include_uploads = self.include_uploads


        field_dict: dict[str, Any] = {}

        field_dict.update({
        })
        if enabled is not UNSET:
            field_dict["enabled"] = enabled
        if provider is not UNSET:
            field_dict["provider"] = provider
        if schedule_cron is not UNSET:
            field_dict["schedule_cron"] = schedule_cron
        if retention_preset is not UNSET:
            field_dict["retention_preset"] = retention_preset
        if include_database is not UNSET:
            field_dict["include_database"] = include_database
        if include_audio_files is not UNSET:
            field_dict["include_audio_files"] = include_audio_files
        if include_album_covers is not UNSET:
            field_dict["include_album_covers"] = include_album_covers
        if include_uploads is not UNSET:
            field_dict["include_uploads"] = include_uploads

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        enabled = d.pop("enabled", UNSET)

        _provider = d.pop("provider", UNSET)
        provider: UpdateBackupPolicyBodyProvider | Unset
        if isinstance(_provider,  Unset):
            provider = UNSET
        else:
            provider = UpdateBackupPolicyBodyProvider(_provider)




        schedule_cron = d.pop("schedule_cron", UNSET)

        _retention_preset = d.pop("retention_preset", UNSET)
        retention_preset: UpdateBackupPolicyBodyRetentionPreset | Unset
        if isinstance(_retention_preset,  Unset):
            retention_preset = UNSET
        else:
            retention_preset = UpdateBackupPolicyBodyRetentionPreset(_retention_preset)




        include_database = d.pop("include_database", UNSET)

        include_audio_files = d.pop("include_audio_files", UNSET)

        include_album_covers = d.pop("include_album_covers", UNSET)

        include_uploads = d.pop("include_uploads", UNSET)

        update_backup_policy_body = cls(
            enabled=enabled,
            provider=provider,
            schedule_cron=schedule_cron,
            retention_preset=retention_preset,
            include_database=include_database,
            include_audio_files=include_audio_files,
            include_album_covers=include_album_covers,
            include_uploads=include_uploads,
        )

        return update_backup_policy_body

