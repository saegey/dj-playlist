from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.generate_genetic_playlist_response_200_result_type_0_item import GenerateGeneticPlaylistResponse200ResultType0Item
  from ..models.generate_genetic_playlist_response_200_result_type_1 import GenerateGeneticPlaylistResponse200ResultType1





T = TypeVar("T", bound="GenerateGeneticPlaylistResponse200")



@_attrs_define
class GenerateGeneticPlaylistResponse200:
    """ 
        Attributes:
            result (GenerateGeneticPlaylistResponse200ResultType1 |
                list[GenerateGeneticPlaylistResponse200ResultType0Item]):
     """

    result: GenerateGeneticPlaylistResponse200ResultType1 | list[GenerateGeneticPlaylistResponse200ResultType0Item]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.generate_genetic_playlist_response_200_result_type_0_item import GenerateGeneticPlaylistResponse200ResultType0Item
        from ..models.generate_genetic_playlist_response_200_result_type_1 import GenerateGeneticPlaylistResponse200ResultType1
        result: dict[str, Any] | list[dict[str, Any]]
        if isinstance(self.result, list):
            result = []
            for result_type_0_item_data in self.result:
                result_type_0_item = result_type_0_item_data.to_dict()
                result.append(result_type_0_item)


        else:
            result = self.result.to_dict()



        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "result": result,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.generate_genetic_playlist_response_200_result_type_0_item import GenerateGeneticPlaylistResponse200ResultType0Item
        from ..models.generate_genetic_playlist_response_200_result_type_1 import GenerateGeneticPlaylistResponse200ResultType1
        d = dict(src_dict)
        def _parse_result(data: object) -> GenerateGeneticPlaylistResponse200ResultType1 | list[GenerateGeneticPlaylistResponse200ResultType0Item]:
            try:
                if not isinstance(data, list):
                    raise TypeError()
                result_type_0 = []
                _result_type_0 = data
                for result_type_0_item_data in (_result_type_0):
                    result_type_0_item = GenerateGeneticPlaylistResponse200ResultType0Item.from_dict(result_type_0_item_data)



                    result_type_0.append(result_type_0_item)

                return result_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            if not isinstance(data, dict):
                raise TypeError()
            result_type_1 = GenerateGeneticPlaylistResponse200ResultType1.from_dict(data)



            return result_type_1

        result = _parse_result(d.pop("result"))


        generate_genetic_playlist_response_200 = cls(
            result=result,
        )


        generate_genetic_playlist_response_200.additional_properties = d
        return generate_genetic_playlist_response_200

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
