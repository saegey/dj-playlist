from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset






T = TypeVar("T", bound="UpdateAiPromptSettingsBody")



@_attrs_define
class UpdateAiPromptSettingsBody:
    """ 
        Attributes:
            friend_id (int):
            prompt (str | Unset):
     """

    friend_id: int
    prompt: str | Unset = UNSET





    def to_dict(self) -> dict[str, Any]:
        friend_id = self.friend_id

        prompt = self.prompt


        field_dict: dict[str, Any] = {}

        field_dict.update({
            "friend_id": friend_id,
        })
        if prompt is not UNSET:
            field_dict["prompt"] = prompt

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        friend_id = d.pop("friend_id")

        prompt = d.pop("prompt", UNSET)

        update_ai_prompt_settings_body = cls(
            friend_id=friend_id,
            prompt=prompt,
        )

        return update_ai_prompt_settings_body

