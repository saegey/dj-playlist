from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset






T = TypeVar("T", bound="GenerateProviderOpenAiTrackMetadataResponse200")



@_attrs_define
class GenerateProviderOpenAiTrackMetadataResponse200:
    """ 
        Attributes:
            genre (str | Unset):
            notes (str | Unset):
     """

    genre: str | Unset = UNSET
    notes: str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        genre = self.genre

        notes = self.notes


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
        })
        if genre is not UNSET:
            field_dict["genre"] = genre
        if notes is not UNSET:
            field_dict["notes"] = notes

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        genre = d.pop("genre", UNSET)

        notes = d.pop("notes", UNSET)

        generate_provider_open_ai_track_metadata_response_200 = cls(
            genre=genre,
            notes=notes,
        )


        generate_provider_open_ai_track_metadata_response_200.additional_properties = d
        return generate_provider_open_ai_track_metadata_response_200

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
