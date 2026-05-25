from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.run_gamdl_action_body_action import RunGamdlActionBodyAction
from ..types import UNSET, Unset






T = TypeVar("T", bound="RunGamdlActionBody")



@_attrs_define
class RunGamdlActionBody:
    """ 
        Attributes:
            action (RunGamdlActionBodyAction):
            friend_id (int | Unset):
     """

    action: RunGamdlActionBodyAction
    friend_id: int | Unset = UNSET





    def to_dict(self) -> dict[str, Any]:
        action = self.action.value

        friend_id = self.friend_id


        field_dict: dict[str, Any] = {}

        field_dict.update({
            "action": action,
        })
        if friend_id is not UNSET:
            field_dict["friend_id"] = friend_id

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        action = RunGamdlActionBodyAction(d.pop("action"))




        friend_id = d.pop("friend_id", UNSET)

        run_gamdl_action_body = cls(
            action=action,
            friend_id=friend_id,
        )

        return run_gamdl_action_body

