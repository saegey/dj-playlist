from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast

if TYPE_CHECKING:
  from ..models.generate_genetic_playlist_body_playlist_item_vectors import GenerateGeneticPlaylistBodyPlaylistItemVectors





T = TypeVar("T", bound="GenerateGeneticPlaylistBodyPlaylistItem")



@_attrs_define
class GenerateGeneticPlaylistBodyPlaylistItem:
    """ 
        Attributes:
            track_id (str):
            friend_id (int | Unset):
            bpm (float | None | str | Unset):
            embedding (list[float] | None | str | Unset):
            field_vectors (GenerateGeneticPlaylistBodyPlaylistItemVectors | Unset):
     """

    track_id: str
    friend_id: int | Unset = UNSET
    bpm: float | None | str | Unset = UNSET
    embedding: list[float] | None | str | Unset = UNSET
    field_vectors: GenerateGeneticPlaylistBodyPlaylistItemVectors | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.generate_genetic_playlist_body_playlist_item_vectors import GenerateGeneticPlaylistBodyPlaylistItemVectors
        track_id = self.track_id

        friend_id = self.friend_id

        bpm: float | None | str | Unset
        if isinstance(self.bpm, Unset):
            bpm = UNSET
        else:
            bpm = self.bpm

        embedding: list[float] | None | str | Unset
        if isinstance(self.embedding, Unset):
            embedding = UNSET
        elif isinstance(self.embedding, list):
            embedding = self.embedding


        else:
            embedding = self.embedding

        field_vectors: dict[str, Any] | Unset = UNSET
        if not isinstance(self.field_vectors, Unset):
            field_vectors = self.field_vectors.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "track_id": track_id,
        })
        if friend_id is not UNSET:
            field_dict["friend_id"] = friend_id
        if bpm is not UNSET:
            field_dict["bpm"] = bpm
        if embedding is not UNSET:
            field_dict["embedding"] = embedding
        if field_vectors is not UNSET:
            field_dict["_vectors"] = field_vectors

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.generate_genetic_playlist_body_playlist_item_vectors import GenerateGeneticPlaylistBodyPlaylistItemVectors
        d = dict(src_dict)
        track_id = d.pop("track_id")

        friend_id = d.pop("friend_id", UNSET)

        def _parse_bpm(data: object) -> float | None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(float | None | str | Unset, data)

        bpm = _parse_bpm(d.pop("bpm", UNSET))


        def _parse_embedding(data: object) -> list[float] | None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            try:
                if not isinstance(data, list):
                    raise TypeError()
                embedding_type_1 = cast(list[float], data)

                return embedding_type_1
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(list[float] | None | str | Unset, data)

        embedding = _parse_embedding(d.pop("embedding", UNSET))


        _field_vectors = d.pop("_vectors", UNSET)
        field_vectors: GenerateGeneticPlaylistBodyPlaylistItemVectors | Unset
        if isinstance(_field_vectors,  Unset):
            field_vectors = UNSET
        else:
            field_vectors = GenerateGeneticPlaylistBodyPlaylistItemVectors.from_dict(_field_vectors)




        generate_genetic_playlist_body_playlist_item = cls(
            track_id=track_id,
            friend_id=friend_id,
            bpm=bpm,
            embedding=embedding,
            field_vectors=field_vectors,
        )


        generate_genetic_playlist_body_playlist_item.additional_properties = d
        return generate_genetic_playlist_body_playlist_item

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
