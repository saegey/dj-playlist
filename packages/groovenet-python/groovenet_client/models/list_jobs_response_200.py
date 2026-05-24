from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast

if TYPE_CHECKING:
  from ..models.list_jobs_response_200_jobs_item import ListJobsResponse200JobsItem
  from ..models.list_jobs_response_200_pagination import ListJobsResponse200Pagination
  from ..models.list_jobs_response_200_summary import ListJobsResponse200Summary





T = TypeVar("T", bound="ListJobsResponse200")



@_attrs_define
class ListJobsResponse200:
    """ 
        Attributes:
            jobs (list[ListJobsResponse200JobsItem]):
            summary (ListJobsResponse200Summary):
            pagination (ListJobsResponse200Pagination | Unset):
     """

    jobs: list[ListJobsResponse200JobsItem]
    summary: ListJobsResponse200Summary
    pagination: ListJobsResponse200Pagination | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.list_jobs_response_200_jobs_item import ListJobsResponse200JobsItem
        from ..models.list_jobs_response_200_pagination import ListJobsResponse200Pagination
        from ..models.list_jobs_response_200_summary import ListJobsResponse200Summary
        jobs = []
        for jobs_item_data in self.jobs:
            jobs_item = jobs_item_data.to_dict()
            jobs.append(jobs_item)



        summary = self.summary.to_dict()

        pagination: dict[str, Any] | Unset = UNSET
        if not isinstance(self.pagination, Unset):
            pagination = self.pagination.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "jobs": jobs,
            "summary": summary,
        })
        if pagination is not UNSET:
            field_dict["pagination"] = pagination

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.list_jobs_response_200_jobs_item import ListJobsResponse200JobsItem
        from ..models.list_jobs_response_200_pagination import ListJobsResponse200Pagination
        from ..models.list_jobs_response_200_summary import ListJobsResponse200Summary
        d = dict(src_dict)
        jobs = []
        _jobs = d.pop("jobs")
        for jobs_item_data in (_jobs):
            jobs_item = ListJobsResponse200JobsItem.from_dict(jobs_item_data)



            jobs.append(jobs_item)


        summary = ListJobsResponse200Summary.from_dict(d.pop("summary"))




        _pagination = d.pop("pagination", UNSET)
        pagination: ListJobsResponse200Pagination | Unset
        if isinstance(_pagination,  Unset):
            pagination = UNSET
        else:
            pagination = ListJobsResponse200Pagination.from_dict(_pagination)




        list_jobs_response_200 = cls(
            jobs=jobs,
            summary=summary,
            pagination=pagination,
        )


        list_jobs_response_200.additional_properties = d
        return list_jobs_response_200

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
