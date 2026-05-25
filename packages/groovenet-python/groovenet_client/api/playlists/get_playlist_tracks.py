from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.get_playlist_tracks_response_200 import GetPlaylistTracksResponse200
from ...models.get_playlist_tracks_response_400 import GetPlaylistTracksResponse400
from ...models.get_playlist_tracks_response_404 import GetPlaylistTracksResponse404
from typing import cast



def _get_kwargs(
    id: int,

) -> dict[str, Any]:
    

    

    

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/playlists/{id}/tracks".format(id=quote(str(id), safe=""),),
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> GetPlaylistTracksResponse200 | GetPlaylistTracksResponse400 | GetPlaylistTracksResponse404 | None:
    if response.status_code == 200:
        response_200 = GetPlaylistTracksResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = GetPlaylistTracksResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 404:
        response_404 = GetPlaylistTracksResponse404.from_dict(response.json())



        return response_404

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[GetPlaylistTracksResponse200 | GetPlaylistTracksResponse400 | GetPlaylistTracksResponse404]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    id: int,
    *,
    client: AuthenticatedClient | Client,

) -> Response[GetPlaylistTracksResponse200 | GetPlaylistTracksResponse400 | GetPlaylistTracksResponse404]:
    """ Get playlist detail

    Args:
        id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[GetPlaylistTracksResponse200 | GetPlaylistTracksResponse400 | GetPlaylistTracksResponse404]
     """


    kwargs = _get_kwargs(
        id=id,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    id: int,
    *,
    client: AuthenticatedClient | Client,

) -> GetPlaylistTracksResponse200 | GetPlaylistTracksResponse400 | GetPlaylistTracksResponse404 | None:
    """ Get playlist detail

    Args:
        id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        GetPlaylistTracksResponse200 | GetPlaylistTracksResponse400 | GetPlaylistTracksResponse404
     """


    return sync_detailed(
        id=id,
client=client,

    ).parsed

async def asyncio_detailed(
    id: int,
    *,
    client: AuthenticatedClient | Client,

) -> Response[GetPlaylistTracksResponse200 | GetPlaylistTracksResponse400 | GetPlaylistTracksResponse404]:
    """ Get playlist detail

    Args:
        id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[GetPlaylistTracksResponse200 | GetPlaylistTracksResponse400 | GetPlaylistTracksResponse404]
     """


    kwargs = _get_kwargs(
        id=id,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    id: int,
    *,
    client: AuthenticatedClient | Client,

) -> GetPlaylistTracksResponse200 | GetPlaylistTracksResponse400 | GetPlaylistTracksResponse404 | None:
    """ Get playlist detail

    Args:
        id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        GetPlaylistTracksResponse200 | GetPlaylistTracksResponse400 | GetPlaylistTracksResponse404
     """


    return (await asyncio_detailed(
        id=id,
client=client,

    )).parsed
