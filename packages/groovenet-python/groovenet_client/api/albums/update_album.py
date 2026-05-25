from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.update_album_body import UpdateAlbumBody
from ...models.update_album_response_200 import UpdateAlbumResponse200
from ...models.update_album_response_400 import UpdateAlbumResponse400
from ...models.update_album_response_404 import UpdateAlbumResponse404
from ...models.update_album_response_409 import UpdateAlbumResponse409
from ...models.update_album_response_500 import UpdateAlbumResponse500
from typing import cast



def _get_kwargs(
    *,
    body: UpdateAlbumBody,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "patch",
        "url": "/api/albums",
    }

    _kwargs["json"] = body.to_dict()


    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> UpdateAlbumResponse200 | UpdateAlbumResponse400 | UpdateAlbumResponse404 | UpdateAlbumResponse409 | UpdateAlbumResponse500 | None:
    if response.status_code == 200:
        response_200 = UpdateAlbumResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = UpdateAlbumResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 404:
        response_404 = UpdateAlbumResponse404.from_dict(response.json())



        return response_404

    if response.status_code == 409:
        response_409 = UpdateAlbumResponse409.from_dict(response.json())



        return response_409

    if response.status_code == 500:
        response_500 = UpdateAlbumResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[UpdateAlbumResponse200 | UpdateAlbumResponse400 | UpdateAlbumResponse404 | UpdateAlbumResponse409 | UpdateAlbumResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: UpdateAlbumBody,

) -> Response[UpdateAlbumResponse200 | UpdateAlbumResponse400 | UpdateAlbumResponse404 | UpdateAlbumResponse409 | UpdateAlbumResponse500]:
    """ Update album metadata

    Args:
        body (UpdateAlbumBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[UpdateAlbumResponse200 | UpdateAlbumResponse400 | UpdateAlbumResponse404 | UpdateAlbumResponse409 | UpdateAlbumResponse500]
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
    body: UpdateAlbumBody,

) -> UpdateAlbumResponse200 | UpdateAlbumResponse400 | UpdateAlbumResponse404 | UpdateAlbumResponse409 | UpdateAlbumResponse500 | None:
    """ Update album metadata

    Args:
        body (UpdateAlbumBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        UpdateAlbumResponse200 | UpdateAlbumResponse400 | UpdateAlbumResponse404 | UpdateAlbumResponse409 | UpdateAlbumResponse500
     """


    return sync_detailed(
        client=client,
body=body,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: UpdateAlbumBody,

) -> Response[UpdateAlbumResponse200 | UpdateAlbumResponse400 | UpdateAlbumResponse404 | UpdateAlbumResponse409 | UpdateAlbumResponse500]:
    """ Update album metadata

    Args:
        body (UpdateAlbumBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[UpdateAlbumResponse200 | UpdateAlbumResponse400 | UpdateAlbumResponse404 | UpdateAlbumResponse409 | UpdateAlbumResponse500]
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
    body: UpdateAlbumBody,

) -> UpdateAlbumResponse200 | UpdateAlbumResponse400 | UpdateAlbumResponse404 | UpdateAlbumResponse409 | UpdateAlbumResponse500 | None:
    """ Update album metadata

    Args:
        body (UpdateAlbumBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        UpdateAlbumResponse200 | UpdateAlbumResponse400 | UpdateAlbumResponse404 | UpdateAlbumResponse409 | UpdateAlbumResponse500
     """


    return (await asyncio_detailed(
        client=client,
body=body,

    )).parsed
