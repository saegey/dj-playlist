from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.create_playlist_body import CreatePlaylistBody
from ...models.create_playlist_response_201 import CreatePlaylistResponse201
from ...models.create_playlist_response_500 import CreatePlaylistResponse500
from typing import cast



def _get_kwargs(
    *,
    body: CreatePlaylistBody,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/playlists",
    }

    _kwargs["json"] = body.to_dict()


    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> CreatePlaylistResponse201 | CreatePlaylistResponse500 | None:
    if response.status_code == 201:
        response_201 = CreatePlaylistResponse201.from_dict(response.json())



        return response_201

    if response.status_code == 500:
        response_500 = CreatePlaylistResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[CreatePlaylistResponse201 | CreatePlaylistResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: CreatePlaylistBody,

) -> Response[CreatePlaylistResponse201 | CreatePlaylistResponse500]:
    """ Create playlist

    Args:
        body (CreatePlaylistBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[CreatePlaylistResponse201 | CreatePlaylistResponse500]
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
    body: CreatePlaylistBody,

) -> CreatePlaylistResponse201 | CreatePlaylistResponse500 | None:
    """ Create playlist

    Args:
        body (CreatePlaylistBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        CreatePlaylistResponse201 | CreatePlaylistResponse500
     """


    return sync_detailed(
        client=client,
body=body,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: CreatePlaylistBody,

) -> Response[CreatePlaylistResponse201 | CreatePlaylistResponse500]:
    """ Create playlist

    Args:
        body (CreatePlaylistBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[CreatePlaylistResponse201 | CreatePlaylistResponse500]
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
    body: CreatePlaylistBody,

) -> CreatePlaylistResponse201 | CreatePlaylistResponse500 | None:
    """ Create playlist

    Args:
        body (CreatePlaylistBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        CreatePlaylistResponse201 | CreatePlaylistResponse500
     """


    return (await asyncio_detailed(
        client=client,
body=body,

    )).parsed
