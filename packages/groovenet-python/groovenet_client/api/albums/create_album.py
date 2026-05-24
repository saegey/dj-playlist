from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.create_album_body import CreateAlbumBody
from ...models.create_album_response_200 import CreateAlbumResponse200
from ...models.create_album_response_400 import CreateAlbumResponse400
from ...models.create_album_response_404 import CreateAlbumResponse404
from ...models.create_album_response_413 import CreateAlbumResponse413
from ...models.create_album_response_500 import CreateAlbumResponse500
from typing import cast



def _get_kwargs(
    *,
    body: CreateAlbumBody,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/albums/create",
    }

    _kwargs["files"] = body.to_multipart()



    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> CreateAlbumResponse200 | CreateAlbumResponse400 | CreateAlbumResponse404 | CreateAlbumResponse413 | CreateAlbumResponse500 | None:
    if response.status_code == 200:
        response_200 = CreateAlbumResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = CreateAlbumResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 404:
        response_404 = CreateAlbumResponse404.from_dict(response.json())



        return response_404

    if response.status_code == 413:
        response_413 = CreateAlbumResponse413.from_dict(response.json())



        return response_413

    if response.status_code == 500:
        response_500 = CreateAlbumResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[CreateAlbumResponse200 | CreateAlbumResponse400 | CreateAlbumResponse404 | CreateAlbumResponse413 | CreateAlbumResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: CreateAlbumBody,

) -> Response[CreateAlbumResponse200 | CreateAlbumResponse400 | CreateAlbumResponse404 | CreateAlbumResponse413 | CreateAlbumResponse500]:
    """ Create a local album with tracks

    Args:
        body (CreateAlbumBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[CreateAlbumResponse200 | CreateAlbumResponse400 | CreateAlbumResponse404 | CreateAlbumResponse413 | CreateAlbumResponse500]
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
    body: CreateAlbumBody,

) -> CreateAlbumResponse200 | CreateAlbumResponse400 | CreateAlbumResponse404 | CreateAlbumResponse413 | CreateAlbumResponse500 | None:
    """ Create a local album with tracks

    Args:
        body (CreateAlbumBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        CreateAlbumResponse200 | CreateAlbumResponse400 | CreateAlbumResponse404 | CreateAlbumResponse413 | CreateAlbumResponse500
     """


    return sync_detailed(
        client=client,
body=body,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: CreateAlbumBody,

) -> Response[CreateAlbumResponse200 | CreateAlbumResponse400 | CreateAlbumResponse404 | CreateAlbumResponse413 | CreateAlbumResponse500]:
    """ Create a local album with tracks

    Args:
        body (CreateAlbumBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[CreateAlbumResponse200 | CreateAlbumResponse400 | CreateAlbumResponse404 | CreateAlbumResponse413 | CreateAlbumResponse500]
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
    body: CreateAlbumBody,

) -> CreateAlbumResponse200 | CreateAlbumResponse400 | CreateAlbumResponse404 | CreateAlbumResponse413 | CreateAlbumResponse500 | None:
    """ Create a local album with tracks

    Args:
        body (CreateAlbumBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        CreateAlbumResponse200 | CreateAlbumResponse400 | CreateAlbumResponse404 | CreateAlbumResponse413 | CreateAlbumResponse500
     """


    return (await asyncio_detailed(
        client=client,
body=body,

    )).parsed
