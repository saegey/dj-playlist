from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset







T = TypeVar("T", bound="PostApiTracksAnalyzeAsyncResponse200")



@_attrs_define
class PostApiTracksAnalyzeAsyncResponse200:
    """ 
        Attributes:
            success (bool):
            job_id (str):
            message (str):
     """

    success: bool
    job_id: str
    message: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        success = self.success

        job_id = self.job_id

        message = self.message


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "success": success,
            "jobId": job_id,
            "message": message,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        success = d.pop("success")

        job_id = d.pop("jobId")

        message = d.pop("message")

        post_api_tracks_analyze_async_response_200 = cls(
            success=success,
            job_id=job_id,
            message=message,
        )


        post_api_tracks_analyze_async_response_200.additional_properties = d
        return post_api_tracks_analyze_async_response_200

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
