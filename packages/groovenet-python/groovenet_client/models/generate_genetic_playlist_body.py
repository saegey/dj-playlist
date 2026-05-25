from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.generate_genetic_playlist_body_playlist_item import GenerateGeneticPlaylistBodyPlaylistItem





T = TypeVar("T", bound="GenerateGeneticPlaylistBody")



@_attrs_define
class GenerateGeneticPlaylistBody:
    """ 
        Attributes:
            playlist (list[GenerateGeneticPlaylistBodyPlaylistItem]):
     """

    playlist: list[GenerateGeneticPlaylistBodyPlaylistItem]





    def to_dict(self) -> dict[str, Any]:
        from ..models.generate_genetic_playlist_body_playlist_item import GenerateGeneticPlaylistBodyPlaylistItem
        playlist = []
        for playlist_item_data in self.playlist:
            playlist_item = playlist_item_data.to_dict()
            playlist.append(playlist_item)




        field_dict: dict[str, Any] = {}

        field_dict.update({
            "playlist": playlist,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.generate_genetic_playlist_body_playlist_item import GenerateGeneticPlaylistBodyPlaylistItem
        d = dict(src_dict)
        playlist = []
        _playlist = d.pop("playlist")
        for playlist_item_data in (_playlist):
            playlist_item = GenerateGeneticPlaylistBodyPlaylistItem.from_dict(playlist_item_data)



            playlist.append(playlist_item)


        generate_genetic_playlist_body = cls(
            playlist=playlist,
        )

        return generate_genetic_playlist_body

