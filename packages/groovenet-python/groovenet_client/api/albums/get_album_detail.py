from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.get_album_detail_response_200 import GetAlbumDetailResponse200
from ...models.get_album_detail_response_400 import GetAlbumDetailResponse400
from ...models.get_album_detail_response_404 import GetAlbumDetailResponse404
from ...models.get_album_detail_response_500 import GetAlbumDetailResponse500
from typing import cast



def _get_kwargs(
    release_id: str,
    *,
    friend_id: int,

) -> dict[str, Any]:
    

    

    params: dict[str, Any] = {}

    params["friend_id"] = friend_id


    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}


    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/albums/{release_id}".format(release_id=quote(str(release_id), safe=""),),
        "params": params,
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> GetAlbumDetailResponse200 | GetAlbumDetailResponse400 | GetAlbumDetailResponse404 | GetAlbumDetailResponse500 | None:
    if response.status_code == 200:
        response_200 = GetAlbumDetailResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = GetAlbumDetailResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 404:
        response_404 = GetAlbumDetailResponse404.from_dict(response.json())



        return response_404

    if response.status_code == 500:
        response_500 = GetAlbumDetailResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[GetAlbumDetailResponse200 | GetAlbumDetailResponse400 | GetAlbumDetailResponse404 | GetAlbumDetailResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    release_id: str,
    *,
    client: AuthenticatedClient | Client,
    friend_id: int,

) -> Response[GetAlbumDetailResponse200 | GetAlbumDetailResponse400 | GetAlbumDetailResponse404 | GetAlbumDetailResponse500]:
    """ Fetch album with tracks

    Args:
        release_id (str):
        friend_id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[GetAlbumDetailResponse200 | GetAlbumDetailResponse400 | GetAlbumDetailResponse404 | GetAlbumDetailResponse500]
     """


    kwargs = _get_kwargs(
        release_id=release_id,
friend_id=friend_id,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    release_id: str,
    *,
    client: AuthenticatedClient | Client,
    friend_id: int,

) -> GetAlbumDetailResponse200 | GetAlbumDetailResponse400 | GetAlbumDetailResponse404 | GetAlbumDetailResponse500 | None:
    """ Fetch album with tracks

    Args:
        release_id (str):
        friend_id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        GetAlbumDetailResponse200 | GetAlbumDetailResponse400 | GetAlbumDetailResponse404 | GetAlbumDetailResponse500
     """


    return sync_detailed(
        release_id=release_id,
client=client,
friend_id=friend_id,

    ).parsed

async def asyncio_detailed(
    release_id: str,
    *,
    client: AuthenticatedClient | Client,
    friend_id: int,

) -> Response[GetAlbumDetailResponse200 | GetAlbumDetailResponse400 | GetAlbumDetailResponse404 | GetAlbumDetailResponse500]:
    """ Fetch album with tracks

    Args:
        release_id (str):
        friend_id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[GetAlbumDetailResponse200 | GetAlbumDetailResponse400 | GetAlbumDetailResponse404 | GetAlbumDetailResponse500]
     """


    kwargs = _get_kwargs(
        release_id=release_id,
friend_id=friend_id,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    release_id: str,
    *,
    client: AuthenticatedClient | Client,
    friend_id: int,

) -> GetAlbumDetailResponse200 | GetAlbumDetailResponse400 | GetAlbumDetailResponse404 | GetAlbumDetailResponse500 | None:
    """ Fetch album with tracks

    Args:
        release_id (str):
        friend_id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        GetAlbumDetailResponse200 | GetAlbumDetailResponse400 | GetAlbumDetailResponse404 | GetAlbumDetailResponse500
     """


    return (await asyncio_detailed(
        release_id=release_id,
client=client,
friend_id=friend_id,

    )).parsed
