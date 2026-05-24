from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.search_albums_response_200_hits_item import SearchAlbumsResponse200HitsItem





T = TypeVar("T", bound="SearchAlbumsResponse200")



@_attrs_define
class SearchAlbumsResponse200:
    """ 
        Attributes:
            hits (list[SearchAlbumsResponse200HitsItem]):
            estimated_total_hits (int):
            offset (int):
            limit (int):
            query (str):
            sort (str):
     """

    hits: list[SearchAlbumsResponse200HitsItem]
    estimated_total_hits: int
    offset: int
    limit: int
    query: str
    sort: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.search_albums_response_200_hits_item import SearchAlbumsResponse200HitsItem
        hits = []
        for hits_item_data in self.hits:
            hits_item = hits_item_data.to_dict()
            hits.append(hits_item)



        estimated_total_hits = self.estimated_total_hits

        offset = self.offset

        limit = self.limit

        query = self.query

        sort = self.sort


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "hits": hits,
            "estimatedTotalHits": estimated_total_hits,
            "offset": offset,
            "limit": limit,
            "query": query,
            "sort": sort,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.search_albums_response_200_hits_item import SearchAlbumsResponse200HitsItem
        d = dict(src_dict)
        hits = []
        _hits = d.pop("hits")
        for hits_item_data in (_hits):
            hits_item = SearchAlbumsResponse200HitsItem.from_dict(hits_item_data)



            hits.append(hits_item)


        estimated_total_hits = d.pop("estimatedTotalHits")

        offset = d.pop("offset")

        limit = d.pop("limit")

        query = d.pop("query")

        sort = d.pop("sort")

        search_albums_response_200 = cls(
            hits=hits,
            estimated_total_hits=estimated_total_hits,
            offset=offset,
            limit=limit,
            query=query,
            sort=sort,
        )


        search_albums_response_200.additional_properties = d
        return search_albums_response_200

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
