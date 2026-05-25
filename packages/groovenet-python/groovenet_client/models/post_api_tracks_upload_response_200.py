from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.post_api_tracks_upload_response_200_analysis import PostApiTracksUploadResponse200Analysis





T = TypeVar("T", bound="PostApiTracksUploadResponse200")



@_attrs_define
class PostApiTracksUploadResponse200:
    """ 
        Attributes:
            success (bool):
            file (str):
            track_id (str):
            local_audio_url (str):
            format_ (str):
            analysis (PostApiTracksUploadResponse200Analysis):
     """

    success: bool
    file: str
    track_id: str
    local_audio_url: str
    format_: str
    analysis: PostApiTracksUploadResponse200Analysis
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.post_api_tracks_upload_response_200_analysis import PostApiTracksUploadResponse200Analysis
        success = self.success

        file = self.file

        track_id = self.track_id

        local_audio_url = self.local_audio_url

        format_ = self.format_

        analysis = self.analysis.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "success": success,
            "file": file,
            "track_id": track_id,
            "local_audio_url": local_audio_url,
            "format": format_,
            "analysis": analysis,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.post_api_tracks_upload_response_200_analysis import PostApiTracksUploadResponse200Analysis
        d = dict(src_dict)
        success = d.pop("success")

        file = d.pop("file")

        track_id = d.pop("track_id")

        local_audio_url = d.pop("local_audio_url")

        format_ = d.pop("format")

        analysis = PostApiTracksUploadResponse200Analysis.from_dict(d.pop("analysis"))




        post_api_tracks_upload_response_200 = cls(
            success=success,
            file=file,
            track_id=track_id,
            local_audio_url=local_audio_url,
            format_=format_,
            analysis=analysis,
        )


        post_api_tracks_upload_response_200.additional_properties = d
        return post_api_tracks_upload_response_200

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
