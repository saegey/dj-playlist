from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset






T = TypeVar("T", bound="UpdateEmbeddingPromptSettingsBody")



@_attrs_define
class UpdateEmbeddingPromptSettingsBody:
    """ 
        Attributes:
            friend_id (int):
            template (str | Unset):
     """

    friend_id: int
    template: str | Unset = UNSET





    def to_dict(self) -> dict[str, Any]:
        friend_id = self.friend_id

        template = self.template


        field_dict: dict[str, Any] = {}

        field_dict.update({
            "friend_id": friend_id,
        })
        if template is not UNSET:
            field_dict["template"] = template

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        friend_id = d.pop("friend_id")

        template = d.pop("template", UNSET)

        update_embedding_prompt_settings_body = cls(
            friend_id=friend_id,
            template=template,
        )

        return update_embedding_prompt_settings_body

