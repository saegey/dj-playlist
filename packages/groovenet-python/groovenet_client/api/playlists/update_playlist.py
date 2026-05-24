from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.update_playlist_body import UpdatePlaylistBody
from ...models.update_playlist_response_200 import UpdatePlaylistResponse200
from ...models.update_playlist_response_400 import UpdatePlaylistResponse400
from ...models.update_playlist_response_404 import UpdatePlaylistResponse404
from ...models.update_playlist_response_500 import UpdatePlaylistResponse500
from typing import cast



def _get_kwargs(
    *,
    body: UpdatePlaylistBody,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "patch",
        "url": "/api/playlists",
    }

    _kwargs["json"] = body.to_dict()


    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> UpdatePlaylistResponse200 | UpdatePlaylistResponse400 | UpdatePlaylistResponse404 | UpdatePlaylistResponse500 | None:
    if response.status_code == 200:
        response_200 = UpdatePlaylistResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = UpdatePlaylistResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 404:
        response_404 = UpdatePlaylistResponse404.from_dict(response.json())



        return response_404

    if response.status_code == 500:
        response_500 = UpdatePlaylistResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[UpdatePlaylistResponse200 | UpdatePlaylistResponse400 | UpdatePlaylistResponse404 | UpdatePlaylistResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: UpdatePlaylistBody,

) -> Response[UpdatePlaylistResponse200 | UpdatePlaylistResponse400 | UpdatePlaylistResponse404 | UpdatePlaylistResponse500]:
    """ Update playlist

    Args:
        body (UpdatePlaylistBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[UpdatePlaylistResponse200 | UpdatePlaylistResponse400 | UpdatePlaylistResponse404 | UpdatePlaylistResponse500]
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
    body: UpdatePlaylistBody,

) -> UpdatePlaylistResponse200 | UpdatePlaylistResponse400 | UpdatePlaylistResponse404 | UpdatePlaylistResponse500 | None:
    """ Update playlist

    Args:
        body (UpdatePlaylistBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        UpdatePlaylistResponse200 | UpdatePlaylistResponse400 | UpdatePlaylistResponse404 | UpdatePlaylistResponse500
     """


    return sync_detailed(
        client=client,
body=body,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: UpdatePlaylistBody,

) -> Response[UpdatePlaylistResponse200 | UpdatePlaylistResponse400 | UpdatePlaylistResponse404 | UpdatePlaylistResponse500]:
    """ Update playlist

    Args:
        body (UpdatePlaylistBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[UpdatePlaylistResponse200 | UpdatePlaylistResponse400 | UpdatePlaylistResponse404 | UpdatePlaylistResponse500]
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
    body: UpdatePlaylistBody,

) -> UpdatePlaylistResponse200 | UpdatePlaylistResponse400 | UpdatePlaylistResponse404 | UpdatePlaylistResponse500 | None:
    """ Update playlist

    Args:
        body (UpdatePlaylistBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        UpdatePlaylistResponse200 | UpdatePlaylistResponse400 | UpdatePlaylistResponse404 | UpdatePlaylistResponse500
     """


    return (await asyncio_detailed(
        client=client,
body=body,

    )).parsed
