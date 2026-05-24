from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.get_api_tracks_id_embedding_preview_response_200_type_1_type import GetApiTracksIdEmbeddingPreviewResponse200Type1Type
from typing import cast

if TYPE_CHECKING:
  from ..models.get_api_tracks_id_embedding_preview_response_200_type_1_data import GetApiTracksIdEmbeddingPreviewResponse200Type1Data





T = TypeVar("T", bound="GetApiTracksIdEmbeddingPreviewResponse200Type1")



@_attrs_define
class GetApiTracksIdEmbeddingPreviewResponse200Type1:
    """ 
        Attributes:
            type_ (GetApiTracksIdEmbeddingPreviewResponse200Type1Type):
            text (str):
            data (GetApiTracksIdEmbeddingPreviewResponse200Type1Data):
     """

    type_: GetApiTracksIdEmbeddingPreviewResponse200Type1Type
    text: str
    data: GetApiTracksIdEmbeddingPreviewResponse200Type1Data
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.get_api_tracks_id_embedding_preview_response_200_type_1_data import GetApiTracksIdEmbeddingPreviewResponse200Type1Data
        type_ = self.type_.value

        text = self.text

        data = self.data.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "type": type_,
            "text": text,
            "data": data,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.get_api_tracks_id_embedding_preview_response_200_type_1_data import GetApiTracksIdEmbeddingPreviewResponse200Type1Data
        d = dict(src_dict)
        type_ = GetApiTracksIdEmbeddingPreviewResponse200Type1Type(d.pop("type"))




        text = d.pop("text")

        data = GetApiTracksIdEmbeddingPreviewResponse200Type1Data.from_dict(d.pop("data"))




        get_api_tracks_id_embedding_preview_response_200_type_1 = cls(
            type_=type_,
            text=text,
            data=data,
        )


        get_api_tracks_id_embedding_preview_response_200_type_1.additional_properties = d
        return get_api_tracks_id_embedding_preview_response_200_type_1

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
