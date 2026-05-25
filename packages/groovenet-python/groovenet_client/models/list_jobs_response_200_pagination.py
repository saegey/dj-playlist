from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset







T = TypeVar("T", bound="ListJobsResponse200Pagination")



@_attrs_define
class ListJobsResponse200Pagination:
    """ 
        Attributes:
            limit (int):
            offset (int):
            total_filtered (int):
            has_more (bool):
     """

    limit: int
    offset: int
    total_filtered: int
    has_more: bool
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        limit = self.limit

        offset = self.offset

        total_filtered = self.total_filtered

        has_more = self.has_more


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "limit": limit,
            "offset": offset,
            "total_filtered": total_filtered,
            "has_more": has_more,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        limit = d.pop("limit")

        offset = d.pop("offset")

        total_filtered = d.pop("total_filtered")

        has_more = d.pop("has_more")

        list_jobs_response_200_pagination = cls(
            limit=limit,
            offset=offset,
            total_filtered=total_filtered,
            has_more=has_more,
        )


        list_jobs_response_200_pagination.additional_properties = d
        return list_jobs_response_200_pagination

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
