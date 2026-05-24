from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.generate_genetic_playlist_response_400_invalid_item import GenerateGeneticPlaylistResponse400InvalidItem





T = TypeVar("T", bound="GenerateGeneticPlaylistResponse400")



@_attrs_define
class GenerateGeneticPlaylistResponse400:
    """ 
        Attributes:
            error (str):
            invalid (list[GenerateGeneticPlaylistResponse400InvalidItem]):
            invalid_count (int):
     """

    error: str
    invalid: list[GenerateGeneticPlaylistResponse400InvalidItem]
    invalid_count: int
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.generate_genetic_playlist_response_400_invalid_item import GenerateGeneticPlaylistResponse400InvalidItem
        error = self.error

        invalid = []
        for invalid_item_data in self.invalid:
            invalid_item = invalid_item_data.to_dict()
            invalid.append(invalid_item)



        invalid_count = self.invalid_count


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "error": error,
            "invalid": invalid,
            "invalid_count": invalid_count,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.generate_genetic_playlist_response_400_invalid_item import GenerateGeneticPlaylistResponse400InvalidItem
        d = dict(src_dict)
        error = d.pop("error")

        invalid = []
        _invalid = d.pop("invalid")
        for invalid_item_data in (_invalid):
            invalid_item = GenerateGeneticPlaylistResponse400InvalidItem.from_dict(invalid_item_data)



            invalid.append(invalid_item)


        invalid_count = d.pop("invalid_count")

        generate_genetic_playlist_response_400 = cls(
            error=error,
            invalid=invalid,
            invalid_count=invalid_count,
        )


        generate_genetic_playlist_response_400.additional_properties = d
        return generate_genetic_playlist_response_400

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
