from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast

if TYPE_CHECKING:
  from ..models.get_api_tracks_id_audio_metadata_response_200_embedded_cover_type_0 import GetApiTracksIdAudioMetadataResponse200EmbeddedCoverType0
  from ..models.get_api_tracks_id_audio_metadata_response_200_probe import GetApiTracksIdAudioMetadataResponse200Probe





T = TypeVar("T", bound="GetApiTracksIdAudioMetadataResponse200")



@_attrs_define
class GetApiTracksIdAudioMetadataResponse200:
    """ 
        Attributes:
            track_id (str):
            friend_id (int):
            local_audio_url (str):
            has_embedded_cover (bool):
            embedded_cover (GetApiTracksIdAudioMetadataResponse200EmbeddedCoverType0 | None):
            probe (GetApiTracksIdAudioMetadataResponse200Probe):
            audio_file_album_art_url (None | str | Unset):
     """

    track_id: str
    friend_id: int
    local_audio_url: str
    has_embedded_cover: bool
    embedded_cover: GetApiTracksIdAudioMetadataResponse200EmbeddedCoverType0 | None
    probe: GetApiTracksIdAudioMetadataResponse200Probe
    audio_file_album_art_url: None | str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.get_api_tracks_id_audio_metadata_response_200_embedded_cover_type_0 import GetApiTracksIdAudioMetadataResponse200EmbeddedCoverType0
        from ..models.get_api_tracks_id_audio_metadata_response_200_probe import GetApiTracksIdAudioMetadataResponse200Probe
        track_id = self.track_id

        friend_id = self.friend_id

        local_audio_url = self.local_audio_url

        has_embedded_cover = self.has_embedded_cover

        embedded_cover: dict[str, Any] | None
        if isinstance(self.embedded_cover, GetApiTracksIdAudioMetadataResponse200EmbeddedCoverType0):
            embedded_cover = self.embedded_cover.to_dict()
        else:
            embedded_cover = self.embedded_cover

        probe = self.probe.to_dict()

        audio_file_album_art_url: None | str | Unset
        if isinstance(self.audio_file_album_art_url, Unset):
            audio_file_album_art_url = UNSET
        else:
            audio_file_album_art_url = self.audio_file_album_art_url


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "track_id": track_id,
            "friend_id": friend_id,
            "local_audio_url": local_audio_url,
            "has_embedded_cover": has_embedded_cover,
            "embedded_cover": embedded_cover,
            "probe": probe,
        })
        if audio_file_album_art_url is not UNSET:
            field_dict["audio_file_album_art_url"] = audio_file_album_art_url

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.get_api_tracks_id_audio_metadata_response_200_embedded_cover_type_0 import GetApiTracksIdAudioMetadataResponse200EmbeddedCoverType0
        from ..models.get_api_tracks_id_audio_metadata_response_200_probe import GetApiTracksIdAudioMetadataResponse200Probe
        d = dict(src_dict)
        track_id = d.pop("track_id")

        friend_id = d.pop("friend_id")

        local_audio_url = d.pop("local_audio_url")

        has_embedded_cover = d.pop("has_embedded_cover")

        def _parse_embedded_cover(data: object) -> GetApiTracksIdAudioMetadataResponse200EmbeddedCoverType0 | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                embedded_cover_type_0 = GetApiTracksIdAudioMetadataResponse200EmbeddedCoverType0.from_dict(data)



                return embedded_cover_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(GetApiTracksIdAudioMetadataResponse200EmbeddedCoverType0 | None, data)

        embedded_cover = _parse_embedded_cover(d.pop("embedded_cover"))


        probe = GetApiTracksIdAudioMetadataResponse200Probe.from_dict(d.pop("probe"))




        def _parse_audio_file_album_art_url(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        audio_file_album_art_url = _parse_audio_file_album_art_url(d.pop("audio_file_album_art_url", UNSET))


        get_api_tracks_id_audio_metadata_response_200 = cls(
            track_id=track_id,
            friend_id=friend_id,
            local_audio_url=local_audio_url,
            has_embedded_cover=has_embedded_cover,
            embedded_cover=embedded_cover,
            probe=probe,
            audio_file_album_art_url=audio_file_album_art_url,
        )


        get_api_tracks_id_audio_metadata_response_200.additional_properties = d
        return get_api_tracks_id_audio_metadata_response_200

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
