from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.recommendation_candidates_batch_response_200_candidates_item import RecommendationCandidatesBatchResponse200CandidatesItem
  from ..models.recommendation_candidates_batch_response_200_seed_embeddings import RecommendationCandidatesBatchResponse200SeedEmbeddings
  from ..models.recommendation_candidates_batch_response_200_stats import RecommendationCandidatesBatchResponse200Stats





T = TypeVar("T", bound="RecommendationCandidatesBatchResponse200")



@_attrs_define
class RecommendationCandidatesBatchResponse200:
    """ 
        Attributes:
            seed_track_id (str):
            seed_friend_id (int):
            seed_embeddings (RecommendationCandidatesBatchResponse200SeedEmbeddings):
            candidates (list[RecommendationCandidatesBatchResponse200CandidatesItem]):
            stats (RecommendationCandidatesBatchResponse200Stats):
     """

    seed_track_id: str
    seed_friend_id: int
    seed_embeddings: RecommendationCandidatesBatchResponse200SeedEmbeddings
    candidates: list[RecommendationCandidatesBatchResponse200CandidatesItem]
    stats: RecommendationCandidatesBatchResponse200Stats
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.recommendation_candidates_batch_response_200_candidates_item import RecommendationCandidatesBatchResponse200CandidatesItem
        from ..models.recommendation_candidates_batch_response_200_seed_embeddings import RecommendationCandidatesBatchResponse200SeedEmbeddings
        from ..models.recommendation_candidates_batch_response_200_stats import RecommendationCandidatesBatchResponse200Stats
        seed_track_id = self.seed_track_id

        seed_friend_id = self.seed_friend_id

        seed_embeddings = self.seed_embeddings.to_dict()

        candidates = []
        for candidates_item_data in self.candidates:
            candidates_item = candidates_item_data.to_dict()
            candidates.append(candidates_item)



        stats = self.stats.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "seedTrackId": seed_track_id,
            "seedFriendId": seed_friend_id,
            "seedEmbeddings": seed_embeddings,
            "candidates": candidates,
            "stats": stats,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.recommendation_candidates_batch_response_200_candidates_item import RecommendationCandidatesBatchResponse200CandidatesItem
        from ..models.recommendation_candidates_batch_response_200_seed_embeddings import RecommendationCandidatesBatchResponse200SeedEmbeddings
        from ..models.recommendation_candidates_batch_response_200_stats import RecommendationCandidatesBatchResponse200Stats
        d = dict(src_dict)
        seed_track_id = d.pop("seedTrackId")

        seed_friend_id = d.pop("seedFriendId")

        seed_embeddings = RecommendationCandidatesBatchResponse200SeedEmbeddings.from_dict(d.pop("seedEmbeddings"))




        candidates = []
        _candidates = d.pop("candidates")
        for candidates_item_data in (_candidates):
            candidates_item = RecommendationCandidatesBatchResponse200CandidatesItem.from_dict(candidates_item_data)



            candidates.append(candidates_item)


        stats = RecommendationCandidatesBatchResponse200Stats.from_dict(d.pop("stats"))




        recommendation_candidates_batch_response_200 = cls(
            seed_track_id=seed_track_id,
            seed_friend_id=seed_friend_id,
            seed_embeddings=seed_embeddings,
            candidates=candidates,
            stats=stats,
        )


        recommendation_candidates_batch_response_200.additional_properties = d
        return recommendation_candidates_batch_response_200

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
