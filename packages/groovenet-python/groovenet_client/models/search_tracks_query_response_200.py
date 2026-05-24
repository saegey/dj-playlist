from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.search_tracks_query_response_200_hits_item import SearchTracksQueryResponse200HitsItem





T = TypeVar("T", bound="SearchTracksQueryResponse200")



@_attrs_define
class SearchTracksQueryResponse200:
    """ 
        Attributes:
            estimated_total_hits (int):
            offset (int):
            limit (int):
            processing_time_ms (int):
            hits (list[SearchTracksQueryResponse200HitsItem]):
     """

    estimated_total_hits: int
    offset: int
    limit: int
    processing_time_ms: int
    hits: list[SearchTracksQueryResponse200HitsItem]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.search_tracks_query_response_200_hits_item import SearchTracksQueryResponse200HitsItem
        estimated_total_hits = self.estimated_total_hits

        offset = self.offset

        limit = self.limit

        processing_time_ms = self.processing_time_ms

        hits = []
        for hits_item_data in self.hits:
            hits_item = hits_item_data.to_dict()
            hits.append(hits_item)




        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "estimatedTotalHits": estimated_total_hits,
            "offset": offset,
            "limit": limit,
            "processingTimeMs": processing_time_ms,
            "hits": hits,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.search_tracks_query_response_200_hits_item import SearchTracksQueryResponse200HitsItem
        d = dict(src_dict)
        estimated_total_hits = d.pop("estimatedTotalHits")

        offset = d.pop("offset")

        limit = d.pop("limit")

        processing_time_ms = d.pop("processingTimeMs")

        hits = []
        _hits = d.pop("hits")
        for hits_item_data in (_hits):
            hits_item = SearchTracksQueryResponse200HitsItem.from_dict(hits_item_data)



            hits.append(hits_item)


        search_tracks_query_response_200 = cls(
            estimated_total_hits=estimated_total_hits,
            offset=offset,
            limit=limit,
            processing_time_ms=processing_time_ms,
            hits=hits,
        )


        search_tracks_query_response_200.additional_properties = d
        return search_tracks_query_response_200

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
