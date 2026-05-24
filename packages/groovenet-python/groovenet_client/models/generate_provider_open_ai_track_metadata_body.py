from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset






T = TypeVar("T", bound="GenerateProviderOpenAiTrackMetadataBody")



@_attrs_define
class GenerateProviderOpenAiTrackMetadataBody:
    """ 
        Attributes:
            prompt (str):
            friend_id (int | Unset):
     """

    prompt: str
    friend_id: int | Unset = UNSET





    def to_dict(self) -> dict[str, Any]:
        prompt = self.prompt

        friend_id = self.friend_id


        field_dict: dict[str, Any] = {}

        field_dict.update({
            "prompt": prompt,
        })
        if friend_id is not UNSET:
            field_dict["friend_id"] = friend_id

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        prompt = d.pop("prompt")

        friend_id = d.pop("friend_id", UNSET)

        generate_provider_open_ai_track_metadata_body = cls(
            prompt=prompt,
            friend_id=friend_id,
        )

        return generate_provider_open_ai_track_metadata_body

