from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.search_albums_missing_audio import SearchAlbumsMissingAudio
from ...models.search_albums_missing_library_identifier import SearchAlbumsMissingLibraryIdentifier
from ...models.search_albums_missing_local_cover_art_url import SearchAlbumsMissingLocalCoverArtUrl
from ...models.search_albums_response_200 import SearchAlbumsResponse200
from ...models.search_albums_response_500 import SearchAlbumsResponse500
from ...types import UNSET, Unset
from typing import cast



def _get_kwargs(
    *,
    q: str | Unset = UNSET,
    sort: str | Unset = 'date_added:desc',
    friend_id: int | Unset = UNSET,
    limit: int | Unset = 20,
    offset: int | Unset = 0,
    missing_library_identifier: SearchAlbumsMissingLibraryIdentifier | Unset = UNSET,
    missing_local_cover_art_url: SearchAlbumsMissingLocalCoverArtUrl | Unset = UNSET,
    missing_audio: SearchAlbumsMissingAudio | Unset = UNSET,

) -> dict[str, Any]:
    

    

    params: dict[str, Any] = {}

    params["q"] = q

    params["sort"] = sort

    params["friend_id"] = friend_id

    params["limit"] = limit

    params["offset"] = offset

    json_missing_library_identifier: int | Unset = UNSET
    if not isinstance(missing_library_identifier, Unset):
        json_missing_library_identifier = missing_library_identifier.value

    params["missing_library_identifier"] = json_missing_library_identifier

    json_missing_local_cover_art_url: int | Unset = UNSET
    if not isinstance(missing_local_cover_art_url, Unset):
        json_missing_local_cover_art_url = missing_local_cover_art_url.value

    params["missing_local_cover_art_url"] = json_missing_local_cover_art_url

    json_missing_audio: int | Unset = UNSET
    if not isinstance(missing_audio, Unset):
        json_missing_audio = missing_audio.value

    params["missing_audio"] = json_missing_audio


    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}


    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/albums",
        "params": params,
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> SearchAlbumsResponse200 | SearchAlbumsResponse500 | None:
    if response.status_code == 200:
        response_200 = SearchAlbumsResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 500:
        response_500 = SearchAlbumsResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[SearchAlbumsResponse200 | SearchAlbumsResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    q: str | Unset = UNSET,
    sort: str | Unset = 'date_added:desc',
    friend_id: int | Unset = UNSET,
    limit: int | Unset = 20,
    offset: int | Unset = 0,
    missing_library_identifier: SearchAlbumsMissingLibraryIdentifier | Unset = UNSET,
    missing_local_cover_art_url: SearchAlbumsMissingLocalCoverArtUrl | Unset = UNSET,
    missing_audio: SearchAlbumsMissingAudio | Unset = UNSET,

) -> Response[SearchAlbumsResponse200 | SearchAlbumsResponse500]:
    """ Search and list albums

    Args:
        q (str | Unset):
        sort (str | Unset):  Default: 'date_added:desc'.
        friend_id (int | Unset):
        limit (int | Unset):  Default: 20.
        offset (int | Unset):  Default: 0.
        missing_library_identifier (SearchAlbumsMissingLibraryIdentifier | Unset): Filter albums
            missing a library identifier
        missing_local_cover_art_url (SearchAlbumsMissingLocalCoverArtUrl | Unset): Filter albums
            missing local cover art
        missing_audio (SearchAlbumsMissingAudio | Unset): Filter albums with at least one track
            missing local audio

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[SearchAlbumsResponse200 | SearchAlbumsResponse500]
     """


    kwargs = _get_kwargs(
        q=q,
sort=sort,
friend_id=friend_id,
limit=limit,
offset=offset,
missing_library_identifier=missing_library_identifier,
missing_local_cover_art_url=missing_local_cover_art_url,
missing_audio=missing_audio,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    *,
    client: AuthenticatedClient | Client,
    q: str | Unset = UNSET,
    sort: str | Unset = 'date_added:desc',
    friend_id: int | Unset = UNSET,
    limit: int | Unset = 20,
    offset: int | Unset = 0,
    missing_library_identifier: SearchAlbumsMissingLibraryIdentifier | Unset = UNSET,
    missing_local_cover_art_url: SearchAlbumsMissingLocalCoverArtUrl | Unset = UNSET,
    missing_audio: SearchAlbumsMissingAudio | Unset = UNSET,

) -> SearchAlbumsResponse200 | SearchAlbumsResponse500 | None:
    """ Search and list albums

    Args:
        q (str | Unset):
        sort (str | Unset):  Default: 'date_added:desc'.
        friend_id (int | Unset):
        limit (int | Unset):  Default: 20.
        offset (int | Unset):  Default: 0.
        missing_library_identifier (SearchAlbumsMissingLibraryIdentifier | Unset): Filter albums
            missing a library identifier
        missing_local_cover_art_url (SearchAlbumsMissingLocalCoverArtUrl | Unset): Filter albums
            missing local cover art
        missing_audio (SearchAlbumsMissingAudio | Unset): Filter albums with at least one track
            missing local audio

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        SearchAlbumsResponse200 | SearchAlbumsResponse500
     """


    return sync_detailed(
        client=client,
q=q,
sort=sort,
friend_id=friend_id,
limit=limit,
offset=offset,
missing_library_identifier=missing_library_identifier,
missing_local_cover_art_url=missing_local_cover_art_url,
missing_audio=missing_audio,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    q: str | Unset = UNSET,
    sort: str | Unset = 'date_added:desc',
    friend_id: int | Unset = UNSET,
    limit: int | Unset = 20,
    offset: int | Unset = 0,
    missing_library_identifier: SearchAlbumsMissingLibraryIdentifier | Unset = UNSET,
    missing_local_cover_art_url: SearchAlbumsMissingLocalCoverArtUrl | Unset = UNSET,
    missing_audio: SearchAlbumsMissingAudio | Unset = UNSET,

) -> Response[SearchAlbumsResponse200 | SearchAlbumsResponse500]:
    """ Search and list albums

    Args:
        q (str | Unset):
        sort (str | Unset):  Default: 'date_added:desc'.
        friend_id (int | Unset):
        limit (int | Unset):  Default: 20.
        offset (int | Unset):  Default: 0.
        missing_library_identifier (SearchAlbumsMissingLibraryIdentifier | Unset): Filter albums
            missing a library identifier
        missing_local_cover_art_url (SearchAlbumsMissingLocalCoverArtUrl | Unset): Filter albums
            missing local cover art
        missing_audio (SearchAlbumsMissingAudio | Unset): Filter albums with at least one track
            missing local audio

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[SearchAlbumsResponse200 | SearchAlbumsResponse500]
     """


    kwargs = _get_kwargs(
        q=q,
sort=sort,
friend_id=friend_id,
limit=limit,
offset=offset,
missing_library_identifier=missing_library_identifier,
missing_local_cover_art_url=missing_local_cover_art_url,
missing_audio=missing_audio,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    *,
    client: AuthenticatedClient | Client,
    q: str | Unset = UNSET,
    sort: str | Unset = 'date_added:desc',
    friend_id: int | Unset = UNSET,
    limit: int | Unset = 20,
    offset: int | Unset = 0,
    missing_library_identifier: SearchAlbumsMissingLibraryIdentifier | Unset = UNSET,
    missing_local_cover_art_url: SearchAlbumsMissingLocalCoverArtUrl | Unset = UNSET,
    missing_audio: SearchAlbumsMissingAudio | Unset = UNSET,

) -> SearchAlbumsResponse200 | SearchAlbumsResponse500 | None:
    """ Search and list albums

    Args:
        q (str | Unset):
        sort (str | Unset):  Default: 'date_added:desc'.
        friend_id (int | Unset):
        limit (int | Unset):  Default: 20.
        offset (int | Unset):  Default: 0.
        missing_library_identifier (SearchAlbumsMissingLibraryIdentifier | Unset): Filter albums
            missing a library identifier
        missing_local_cover_art_url (SearchAlbumsMissingLocalCoverArtUrl | Unset): Filter albums
            missing local cover art
        missing_audio (SearchAlbumsMissingAudio | Unset): Filter albums with at least one track
            missing local audio

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        SearchAlbumsResponse200 | SearchAlbumsResponse500
     """


    return (await asyncio_detailed(
        client=client,
q=q,
sort=sort,
friend_id=friend_id,
limit=limit,
offset=offset,
missing_library_identifier=missing_library_identifier,
missing_local_cover_art_url=missing_local_cover_art_url,
missing_audio=missing_audio,

    )).parsed
