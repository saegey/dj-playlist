from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast

if TYPE_CHECKING:
  from ..models.recommendation_candidates_batch_body_tracks_item import RecommendationCandidatesBatchBodyTracksItem





T = TypeVar("T", bound="RecommendationCandidatesBatchBody")



@_attrs_define
class RecommendationCandidatesBatchBody:
    """ 
        Attributes:
            tracks (list[RecommendationCandidatesBatchBodyTracksItem]):
            limit_identity (int | Unset):  Default: 200.
            limit_audio (int | Unset):  Default: 200.
            ivfflat_probes (int | Unset):  Default: 10.
     """

    tracks: list[RecommendationCandidatesBatchBodyTracksItem]
    limit_identity: int | Unset = 200
    limit_audio: int | Unset = 200
    ivfflat_probes: int | Unset = 10





    def to_dict(self) -> dict[str, Any]:
        from ..models.recommendation_candidates_batch_body_tracks_item import RecommendationCandidatesBatchBodyTracksItem
        tracks = []
        for tracks_item_data in self.tracks:
            tracks_item = tracks_item_data.to_dict()
            tracks.append(tracks_item)



        limit_identity = self.limit_identity

        limit_audio = self.limit_audio

        ivfflat_probes = self.ivfflat_probes


        field_dict: dict[str, Any] = {}

        field_dict.update({
            "tracks": tracks,
        })
        if limit_identity is not UNSET:
            field_dict["limit_identity"] = limit_identity
        if limit_audio is not UNSET:
            field_dict["limit_audio"] = limit_audio
        if ivfflat_probes is not UNSET:
            field_dict["ivfflat_probes"] = ivfflat_probes

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.recommendation_candidates_batch_body_tracks_item import RecommendationCandidatesBatchBodyTracksItem
        d = dict(src_dict)
        tracks = []
        _tracks = d.pop("tracks")
        for tracks_item_data in (_tracks):
            tracks_item = RecommendationCandidatesBatchBodyTracksItem.from_dict(tracks_item_data)



            tracks.append(tracks_item)


        limit_identity = d.pop("limit_identity", UNSET)

        limit_audio = d.pop("limit_audio", UNSET)

        ivfflat_probes = d.pop("ivfflat_probes", UNSET)

        recommendation_candidates_batch_body = cls(
            tracks=tracks,
            limit_identity=limit_identity,
            limit_audio=limit_audio,
            ivfflat_probes=ivfflat_probes,
        )

        return recommendation_candidates_batch_body

