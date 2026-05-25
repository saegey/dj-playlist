from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset







T = TypeVar("T", bound="AddFriendBody")



@_attrs_define
class AddFriendBody:
    """ 
        Attributes:
            username (str):
     """

    username: str





    def to_dict(self) -> dict[str, Any]:
        username = self.username


        field_dict: dict[str, Any] = {}

        field_dict.update({
            "username": username,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        username = d.pop("username")

        add_friend_body = cls(
            username=username,
        )

        return add_friend_body

