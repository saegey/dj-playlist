from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.upload_gamdl_cookie_file_response_200_cookie_info import UploadGamdlCookieFileResponse200CookieInfo





T = TypeVar("T", bound="UploadGamdlCookieFileResponse200")



@_attrs_define
class UploadGamdlCookieFileResponse200:
    """ 
        Attributes:
            success (bool):
            message (str):
            cookie_info (UploadGamdlCookieFileResponse200CookieInfo):
     """

    success: bool
    message: str
    cookie_info: UploadGamdlCookieFileResponse200CookieInfo
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.upload_gamdl_cookie_file_response_200_cookie_info import UploadGamdlCookieFileResponse200CookieInfo
        success = self.success

        message = self.message

        cookie_info = self.cookie_info.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "success": success,
            "message": message,
            "cookieInfo": cookie_info,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.upload_gamdl_cookie_file_response_200_cookie_info import UploadGamdlCookieFileResponse200CookieInfo
        d = dict(src_dict)
        success = d.pop("success")

        message = d.pop("message")

        cookie_info = UploadGamdlCookieFileResponse200CookieInfo.from_dict(d.pop("cookieInfo"))




        upload_gamdl_cookie_file_response_200 = cls(
            success=success,
            message=message,
            cookie_info=cookie_info,
        )


        upload_gamdl_cookie_file_response_200.additional_properties = d
        return upload_gamdl_cookie_file_response_200

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
