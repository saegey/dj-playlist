from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.search_tracks_query_response_200 import SearchTracksQueryResponse200
from ...models.search_tracks_query_response_500 import SearchTracksQueryResponse500
from ...types import UNSET, Unset
from typing import cast



def _get_kwargs(
    *,
    q: str | Unset = UNSET,
    limit: int | Unset = 20,
    offset: int | Unset = 0,
    friend_id: int | Unset = UNSET,
    filter_: str | Unset = UNSET,

) -> dict[str, Any]:
    

    

    params: dict[str, Any] = {}

    params["q"] = q

    params["limit"] = limit

    params["offset"] = offset

    params["friend_id"] = friend_id

    params["filter"] = filter_


    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}


    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/tracks/search",
        "params": params,
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> SearchTracksQueryResponse200 | SearchTracksQueryResponse500 | None:
    if response.status_code == 200:
        response_200 = SearchTracksQueryResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 500:
        response_500 = SearchTracksQueryResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[SearchTracksQueryResponse200 | SearchTracksQueryResponse500]:
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
    limit: int | Unset = 20,
    offset: int | Unset = 0,
    friend_id: int | Unset = UNSET,
    filter_: str | Unset = UNSET,

) -> Response[SearchTracksQueryResponse200 | SearchTracksQueryResponse500]:
    """ Search tracks (query params)

    Args:
        q (str | Unset):
        limit (int | Unset):  Default: 20.
        offset (int | Unset):  Default: 0.
        friend_id (int | Unset):
        filter_ (str | Unset): SQL-style filter expression. Multiple conditions joined with ' AND
            '. Supported values: 'local_audio_url IS NULL' (missing audio), '(bpm IS NULL OR key IS
            NULL)' (missing metadata), 'apple_music_url IS NULL' (missing Apple Music), 'youtube_url
            IS NULL' (missing YouTube), 'soundcloud_url IS NULL' (missing SoundCloud),
            '(apple_music_url IS NULL AND youtube_url IS NULL AND soundcloud_url IS NULL)' (missing
            all streaming URLs).

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[SearchTracksQueryResponse200 | SearchTracksQueryResponse500]
     """


    kwargs = _get_kwargs(
        q=q,
limit=limit,
offset=offset,
friend_id=friend_id,
filter_=filter_,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    *,
    client: AuthenticatedClient | Client,
    q: str | Unset = UNSET,
    limit: int | Unset = 20,
    offset: int | Unset = 0,
    friend_id: int | Unset = UNSET,
    filter_: str | Unset = UNSET,

) -> SearchTracksQueryResponse200 | SearchTracksQueryResponse500 | None:
    """ Search tracks (query params)

    Args:
        q (str | Unset):
        limit (int | Unset):  Default: 20.
        offset (int | Unset):  Default: 0.
        friend_id (int | Unset):
        filter_ (str | Unset): SQL-style filter expression. Multiple conditions joined with ' AND
            '. Supported values: 'local_audio_url IS NULL' (missing audio), '(bpm IS NULL OR key IS
            NULL)' (missing metadata), 'apple_music_url IS NULL' (missing Apple Music), 'youtube_url
            IS NULL' (missing YouTube), 'soundcloud_url IS NULL' (missing SoundCloud),
            '(apple_music_url IS NULL AND youtube_url IS NULL AND soundcloud_url IS NULL)' (missing
            all streaming URLs).

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        SearchTracksQueryResponse200 | SearchTracksQueryResponse500
     """


    return sync_detailed(
        client=client,
q=q,
limit=limit,
offset=offset,
friend_id=friend_id,
filter_=filter_,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    q: str | Unset = UNSET,
    limit: int | Unset = 20,
    offset: int | Unset = 0,
    friend_id: int | Unset = UNSET,
    filter_: str | Unset = UNSET,

) -> Response[SearchTracksQueryResponse200 | SearchTracksQueryResponse500]:
    """ Search tracks (query params)

    Args:
        q (str | Unset):
        limit (int | Unset):  Default: 20.
        offset (int | Unset):  Default: 0.
        friend_id (int | Unset):
        filter_ (str | Unset): SQL-style filter expression. Multiple conditions joined with ' AND
            '. Supported values: 'local_audio_url IS NULL' (missing audio), '(bpm IS NULL OR key IS
            NULL)' (missing metadata), 'apple_music_url IS NULL' (missing Apple Music), 'youtube_url
            IS NULL' (missing YouTube), 'soundcloud_url IS NULL' (missing SoundCloud),
            '(apple_music_url IS NULL AND youtube_url IS NULL AND soundcloud_url IS NULL)' (missing
            all streaming URLs).

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[SearchTracksQueryResponse200 | SearchTracksQueryResponse500]
     """


    kwargs = _get_kwargs(
        q=q,
limit=limit,
offset=offset,
friend_id=friend_id,
filter_=filter_,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    *,
    client: AuthenticatedClient | Client,
    q: str | Unset = UNSET,
    limit: int | Unset = 20,
    offset: int | Unset = 0,
    friend_id: int | Unset = UNSET,
    filter_: str | Unset = UNSET,

) -> SearchTracksQueryResponse200 | SearchTracksQueryResponse500 | None:
    """ Search tracks (query params)

    Args:
        q (str | Unset):
        limit (int | Unset):  Default: 20.
        offset (int | Unset):  Default: 0.
        friend_id (int | Unset):
        filter_ (str | Unset): SQL-style filter expression. Multiple conditions joined with ' AND
            '. Supported values: 'local_audio_url IS NULL' (missing audio), '(bpm IS NULL OR key IS
            NULL)' (missing metadata), 'apple_music_url IS NULL' (missing Apple Music), 'youtube_url
            IS NULL' (missing YouTube), 'soundcloud_url IS NULL' (missing SoundCloud),
            '(apple_music_url IS NULL AND youtube_url IS NULL AND soundcloud_url IS NULL)' (missing
            all streaming URLs).

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        SearchTracksQueryResponse200 | SearchTracksQueryResponse500
     """


    return (await asyncio_detailed(
        client=client,
q=q,
limit=limit,
offset=offset,
friend_id=friend_id,
filter_=filter_,

    )).parsed
