from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset







T = TypeVar("T", bound="GetAiPromptSettingsResponse200")



@_attrs_define
class GetAiPromptSettingsResponse200:
    """ 
        Attributes:
            prompt (str):
            default_prompt (str):
            is_default (bool):
     """

    prompt: str
    default_prompt: str
    is_default: bool
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        prompt = self.prompt

        default_prompt = self.default_prompt

        is_default = self.is_default


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "prompt": prompt,
            "defaultPrompt": default_prompt,
            "isDefault": is_default,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        prompt = d.pop("prompt")

        default_prompt = d.pop("defaultPrompt")

        is_default = d.pop("isDefault")

        get_ai_prompt_settings_response_200 = cls(
            prompt=prompt,
            default_prompt=default_prompt,
            is_default=is_default,
        )


        get_ai_prompt_settings_response_200.additional_properties = d
        return get_ai_prompt_settings_response_200

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
