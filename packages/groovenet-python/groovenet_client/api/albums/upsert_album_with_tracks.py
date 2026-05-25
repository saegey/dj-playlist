from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.upsert_album_with_tracks_body import UpsertAlbumWithTracksBody
from ...models.upsert_album_with_tracks_response_200 import UpsertAlbumWithTracksResponse200
from ...models.upsert_album_with_tracks_response_400 import UpsertAlbumWithTracksResponse400
from ...models.upsert_album_with_tracks_response_404 import UpsertAlbumWithTracksResponse404
from ...models.upsert_album_with_tracks_response_413 import UpsertAlbumWithTracksResponse413
from ...models.upsert_album_with_tracks_response_500 import UpsertAlbumWithTracksResponse500
from typing import cast



def _get_kwargs(
    *,
    body: UpsertAlbumWithTracksBody,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/albums/upsert",
    }

    _kwargs["files"] = body.to_multipart()



    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> UpsertAlbumWithTracksResponse200 | UpsertAlbumWithTracksResponse400 | UpsertAlbumWithTracksResponse404 | UpsertAlbumWithTracksResponse413 | UpsertAlbumWithTracksResponse500 | None:
    if response.status_code == 200:
        response_200 = UpsertAlbumWithTracksResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = UpsertAlbumWithTracksResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 404:
        response_404 = UpsertAlbumWithTracksResponse404.from_dict(response.json())



        return response_404

    if response.status_code == 413:
        response_413 = UpsertAlbumWithTracksResponse413.from_dict(response.json())



        return response_413

    if response.status_code == 500:
        response_500 = UpsertAlbumWithTracksResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[UpsertAlbumWithTracksResponse200 | UpsertAlbumWithTracksResponse400 | UpsertAlbumWithTracksResponse404 | UpsertAlbumWithTracksResponse413 | UpsertAlbumWithTracksResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: UpsertAlbumWithTracksBody,

) -> Response[UpsertAlbumWithTracksResponse200 | UpsertAlbumWithTracksResponse400 | UpsertAlbumWithTracksResponse404 | UpsertAlbumWithTracksResponse413 | UpsertAlbumWithTracksResponse500]:
    """ Create or update album and tracks

    Args:
        body (UpsertAlbumWithTracksBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[UpsertAlbumWithTracksResponse200 | UpsertAlbumWithTracksResponse400 | UpsertAlbumWithTracksResponse404 | UpsertAlbumWithTracksResponse413 | UpsertAlbumWithTracksResponse500]
     """


    kwargs = _get_kwargs(
        body=body,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    *,
    client: AuthenticatedClient | Client,
    body: UpsertAlbumWithTracksBody,

) -> UpsertAlbumWithTracksResponse200 | UpsertAlbumWithTracksResponse400 | UpsertAlbumWithTracksResponse404 | UpsertAlbumWithTracksResponse413 | UpsertAlbumWithTracksResponse500 | None:
    """ Create or update album and tracks

    Args:
        body (UpsertAlbumWithTracksBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        UpsertAlbumWithTracksResponse200 | UpsertAlbumWithTracksResponse400 | UpsertAlbumWithTracksResponse404 | UpsertAlbumWithTracksResponse413 | UpsertAlbumWithTracksResponse500
     """


    return sync_detailed(
        client=client,
body=body,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: UpsertAlbumWithTracksBody,

) -> Response[UpsertAlbumWithTracksResponse200 | UpsertAlbumWithTracksResponse400 | UpsertAlbumWithTracksResponse404 | UpsertAlbumWithTracksResponse413 | UpsertAlbumWithTracksResponse500]:
    """ Create or update album and tracks

    Args:
        body (UpsertAlbumWithTracksBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[UpsertAlbumWithTracksResponse200 | UpsertAlbumWithTracksResponse400 | UpsertAlbumWithTracksResponse404 | UpsertAlbumWithTracksResponse413 | UpsertAlbumWithTracksResponse500]
     """


    kwargs = _get_kwargs(
        body=body,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    *,
    client: AuthenticatedClient | Client,
    body: UpsertAlbumWithTracksBody,

) -> UpsertAlbumWithTracksResponse200 | UpsertAlbumWithTracksResponse400 | UpsertAlbumWithTracksResponse404 | UpsertAlbumWithTracksResponse413 | UpsertAlbumWithTracksResponse500 | None:
    """ Create or update album and tracks

    Args:
        body (UpsertAlbumWithTracksBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        UpsertAlbumWithTracksResponse200 | UpsertAlbumWithTracksResponse400 | UpsertAlbumWithTracksResponse404 | UpsertAlbumWithTracksResponse413 | UpsertAlbumWithTracksResponse500
     """


    return (await asyncio_detailed(
        client=client,
body=body,

    )).parsed
