from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset






T = TypeVar("T", bound="GenerateGeneticPlaylistResponse400InvalidItem")



@_attrs_define
class GenerateGeneticPlaylistResponse400InvalidItem:
    """ 
        Attributes:
            reason (str):
            track_id (str | Unset):
     """

    reason: str
    track_id: str | Unset = UNSET





    def to_dict(self) -> dict[str, Any]:
        reason = self.reason

        track_id = self.track_id


        field_dict: dict[str, Any] = {}

        field_dict.update({
            "reason": reason,
        })
        if track_id is not UNSET:
            field_dict["track_id"] = track_id

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        reason = d.pop("reason")

        track_id = d.pop("track_id", UNSET)

        generate_genetic_playlist_response_400_invalid_item = cls(
            reason=reason,
            track_id=track_id,
        )

        return generate_genetic_playlist_response_400_invalid_item

