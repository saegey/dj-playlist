from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast






T = TypeVar("T", bound="GenerateGeneticPlaylistBodyPlaylistItemVectors")



@_attrs_define
class GenerateGeneticPlaylistBodyPlaylistItemVectors:
    """ 
        Attributes:
            default (list[float] | Unset):
     """

    default: list[float] | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        default: list[float] | Unset = UNSET
        if not isinstance(self.default, Unset):
            default = self.default




        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
        })
        if default is not UNSET:
            field_dict["default"] = default

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        default = cast(list[float], d.pop("default", UNSET))


        generate_genetic_playlist_body_playlist_item_vectors = cls(
            default=default,
        )


        generate_genetic_playlist_body_playlist_item_vectors.additional_properties = d
        return generate_genetic_playlist_body_playlist_item_vectors

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
