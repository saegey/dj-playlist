from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.recommendation_candidates_batch_response_200_candidates_item_metadata import RecommendationCandidatesBatchResponse200CandidatesItemMetadata





T = TypeVar("T", bound="RecommendationCandidatesBatchResponse200CandidatesItem")



@_attrs_define
class RecommendationCandidatesBatchResponse200CandidatesItem:
    """ 
        Attributes:
            track_id (str):
            friend_id (int):
            sim_identity (float | None):
            sim_audio (float | None):
            metadata (RecommendationCandidatesBatchResponse200CandidatesItemMetadata):
     """

    track_id: str
    friend_id: int
    sim_identity: float | None
    sim_audio: float | None
    metadata: RecommendationCandidatesBatchResponse200CandidatesItemMetadata
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.recommendation_candidates_batch_response_200_candidates_item_metadata import RecommendationCandidatesBatchResponse200CandidatesItemMetadata
        track_id = self.track_id

        friend_id = self.friend_id

        sim_identity: float | None
        sim_identity = self.sim_identity

        sim_audio: float | None
        sim_audio = self.sim_audio

        metadata = self.metadata.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "trackId": track_id,
            "friendId": friend_id,
            "simIdentity": sim_identity,
            "simAudio": sim_audio,
            "metadata": metadata,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.recommendation_candidates_batch_response_200_candidates_item_metadata import RecommendationCandidatesBatchResponse200CandidatesItemMetadata
        d = dict(src_dict)
        track_id = d.pop("trackId")

        friend_id = d.pop("friendId")

        def _parse_sim_identity(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        sim_identity = _parse_sim_identity(d.pop("simIdentity"))


        def _parse_sim_audio(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        sim_audio = _parse_sim_audio(d.pop("simAudio"))


        metadata = RecommendationCandidatesBatchResponse200CandidatesItemMetadata.from_dict(d.pop("metadata"))




        recommendation_candidates_batch_response_200_candidates_item = cls(
            track_id=track_id,
            friend_id=friend_id,
            sim_identity=sim_identity,
            sim_audio=sim_audio,
            metadata=metadata,
        )


        recommendation_candidates_batch_response_200_candidates_item.additional_properties = d
        return recommendation_candidates_batch_response_200_candidates_item

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
