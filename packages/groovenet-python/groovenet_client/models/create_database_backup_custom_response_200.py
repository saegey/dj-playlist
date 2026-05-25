from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.create_database_backup_custom_response_200_format import CreateDatabaseBackupCustomResponse200Format






T = TypeVar("T", bound="CreateDatabaseBackupCustomResponse200")



@_attrs_define
class CreateDatabaseBackupCustomResponse200:
    """ 
        Attributes:
            message (str):
            filename (str):
            format_ (CreateDatabaseBackupCustomResponse200Format):
     """

    message: str
    filename: str
    format_: CreateDatabaseBackupCustomResponse200Format
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        message = self.message

        filename = self.filename

        format_ = self.format_.value


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "message": message,
            "filename": filename,
            "format": format_,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        message = d.pop("message")

        filename = d.pop("filename")

        format_ = CreateDatabaseBackupCustomResponse200Format(d.pop("format"))




        create_database_backup_custom_response_200 = cls(
            message=message,
            filename=filename,
            format_=format_,
        )


        create_database_backup_custom_response_200.additional_properties = d
        return create_database_backup_custom_response_200

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
