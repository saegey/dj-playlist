from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset







T = TypeVar("T", bound="RecommendationCandidatesResponse200SeedEmbeddings")



@_attrs_define
class RecommendationCandidatesResponse200SeedEmbeddings:
    """ 
        Attributes:
            identity (bool):
            audio (bool):
     """

    identity: bool
    audio: bool
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        identity = self.identity

        audio = self.audio


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "identity": identity,
            "audio": audio,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        identity = d.pop("identity")

        audio = d.pop("audio")

        recommendation_candidates_response_200_seed_embeddings = cls(
            identity=identity,
            audio=audio,
        )


        recommendation_candidates_response_200_seed_embeddings.additional_properties = d
        return recommendation_candidates_response_200_seed_embeddings

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
