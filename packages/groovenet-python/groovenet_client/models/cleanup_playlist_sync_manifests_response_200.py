from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.cleanup_playlist_sync_manifests_response_200_results_item import CleanupPlaylistSyncManifestsResponse200ResultsItem
  from ..models.cleanup_playlist_sync_manifests_response_200_summary import CleanupPlaylistSyncManifestsResponse200Summary





T = TypeVar("T", bound="CleanupPlaylistSyncManifestsResponse200")



@_attrs_define
class CleanupPlaylistSyncManifestsResponse200:
    """ 
        Attributes:
            message (str):
            results (list[CleanupPlaylistSyncManifestsResponse200ResultsItem]):
            summary (CleanupPlaylistSyncManifestsResponse200Summary):
     """

    message: str
    results: list[CleanupPlaylistSyncManifestsResponse200ResultsItem]
    summary: CleanupPlaylistSyncManifestsResponse200Summary
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.cleanup_playlist_sync_manifests_response_200_results_item import CleanupPlaylistSyncManifestsResponse200ResultsItem
        from ..models.cleanup_playlist_sync_manifests_response_200_summary import CleanupPlaylistSyncManifestsResponse200Summary
        message = self.message

        results = []
        for results_item_data in self.results:
            results_item = results_item_data.to_dict()
            results.append(results_item)



        summary = self.summary.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "message": message,
            "results": results,
            "summary": summary,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.cleanup_playlist_sync_manifests_response_200_results_item import CleanupPlaylistSyncManifestsResponse200ResultsItem
        from ..models.cleanup_playlist_sync_manifests_response_200_summary import CleanupPlaylistSyncManifestsResponse200Summary
        d = dict(src_dict)
        message = d.pop("message")

        results = []
        _results = d.pop("results")
        for results_item_data in (_results):
            results_item = CleanupPlaylistSyncManifestsResponse200ResultsItem.from_dict(results_item_data)



            results.append(results_item)


        summary = CleanupPlaylistSyncManifestsResponse200Summary.from_dict(d.pop("summary"))




        cleanup_playlist_sync_manifests_response_200 = cls(
            message=message,
            results=results,
            summary=summary,
        )


        cleanup_playlist_sync_manifests_response_200.additional_properties = d
        return cleanup_playlist_sync_manifests_response_200

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
