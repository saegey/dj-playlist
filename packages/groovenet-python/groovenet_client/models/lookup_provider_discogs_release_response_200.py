from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast

if TYPE_CHECKING:
  from ..models.lookup_provider_discogs_release_response_200_matched_track import LookupProviderDiscogsReleaseResponse200MatchedTrack
  from ..models.lookup_provider_discogs_release_response_200_release import LookupProviderDiscogsReleaseResponse200Release





T = TypeVar("T", bound="LookupProviderDiscogsReleaseResponse200")



@_attrs_define
class LookupProviderDiscogsReleaseResponse200:
    """ 
        Attributes:
            release_id (str | Unset):
            file_path (str | Unset):
            release (LookupProviderDiscogsReleaseResponse200Release | Unset):
            matched_track (LookupProviderDiscogsReleaseResponse200MatchedTrack | Unset):
     """

    release_id: str | Unset = UNSET
    file_path: str | Unset = UNSET
    release: LookupProviderDiscogsReleaseResponse200Release | Unset = UNSET
    matched_track: LookupProviderDiscogsReleaseResponse200MatchedTrack | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.lookup_provider_discogs_release_response_200_matched_track import LookupProviderDiscogsReleaseResponse200MatchedTrack
        from ..models.lookup_provider_discogs_release_response_200_release import LookupProviderDiscogsReleaseResponse200Release
        release_id = self.release_id

        file_path = self.file_path

        release: dict[str, Any] | Unset = UNSET
        if not isinstance(self.release, Unset):
            release = self.release.to_dict()

        matched_track: dict[str, Any] | Unset = UNSET
        if not isinstance(self.matched_track, Unset):
            matched_track = self.matched_track.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
        })
        if release_id is not UNSET:
            field_dict["releaseId"] = release_id
        if file_path is not UNSET:
            field_dict["filePath"] = file_path
        if release is not UNSET:
            field_dict["release"] = release
        if matched_track is not UNSET:
            field_dict["matchedTrack"] = matched_track

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.lookup_provider_discogs_release_response_200_matched_track import LookupProviderDiscogsReleaseResponse200MatchedTrack
        from ..models.lookup_provider_discogs_release_response_200_release import LookupProviderDiscogsReleaseResponse200Release
        d = dict(src_dict)
        release_id = d.pop("releaseId", UNSET)

        file_path = d.pop("filePath", UNSET)

        _release = d.pop("release", UNSET)
        release: LookupProviderDiscogsReleaseResponse200Release | Unset
        if isinstance(_release,  Unset):
            release = UNSET
        else:
            release = LookupProviderDiscogsReleaseResponse200Release.from_dict(_release)




        _matched_track = d.pop("matchedTrack", UNSET)
        matched_track: LookupProviderDiscogsReleaseResponse200MatchedTrack | Unset
        if isinstance(_matched_track,  Unset):
            matched_track = UNSET
        else:
            matched_track = LookupProviderDiscogsReleaseResponse200MatchedTrack.from_dict(_matched_track)




        lookup_provider_discogs_release_response_200 = cls(
            release_id=release_id,
            file_path=file_path,
            release=release,
            matched_track=matched_track,
        )


        lookup_provider_discogs_release_response_200.additional_properties = d
        return lookup_provider_discogs_release_response_200

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
