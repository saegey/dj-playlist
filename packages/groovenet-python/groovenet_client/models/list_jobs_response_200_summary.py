from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset







T = TypeVar("T", bound="ListJobsResponse200Summary")



@_attrs_define
class ListJobsResponse200Summary:
    """ 
        Attributes:
            total (int):
            waiting (int):
            active (int):
            completed (int):
            failed (int):
     """

    total: int
    waiting: int
    active: int
    completed: int
    failed: int
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        total = self.total

        waiting = self.waiting

        active = self.active

        completed = self.completed

        failed = self.failed


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "total": total,
            "waiting": waiting,
            "active": active,
            "completed": completed,
            "failed": failed,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        total = d.pop("total")

        waiting = d.pop("waiting")

        active = d.pop("active")

        completed = d.pop("completed")

        failed = d.pop("failed")

        list_jobs_response_200_summary = cls(
            total=total,
            waiting=waiting,
            active=active,
            completed=completed,
            failed=failed,
        )


        list_jobs_response_200_summary.additional_properties = d
        return list_jobs_response_200_summary

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
