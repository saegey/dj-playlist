from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset







T = TypeVar("T", bound="GetEmbeddingPromptSettingsResponse200")



@_attrs_define
class GetEmbeddingPromptSettingsResponse200:
    """ 
        Attributes:
            template (str):
            default_template (str):
            is_default (bool):
     """

    template: str
    default_template: str
    is_default: bool
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        template = self.template

        default_template = self.default_template

        is_default = self.is_default


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "template": template,
            "defaultTemplate": default_template,
            "isDefault": is_default,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        template = d.pop("template")

        default_template = d.pop("defaultTemplate")

        is_default = d.pop("isDefault")

        get_embedding_prompt_settings_response_200 = cls(
            template=template,
            default_template=default_template,
            is_default=is_default,
        )


        get_embedding_prompt_settings_response_200.additional_properties = d
        return get_embedding_prompt_settings_response_200

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
