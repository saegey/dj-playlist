from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.search_provider_you_tube_music_body import SearchProviderYouTubeMusicBody
from ...models.search_provider_you_tube_music_response_200 import SearchProviderYouTubeMusicResponse200
from ...models.search_provider_you_tube_music_response_500 import SearchProviderYouTubeMusicResponse500
from typing import cast



def _get_kwargs(
    *,
    body: SearchProviderYouTubeMusicBody,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/providers/youtube/music-search",
    }

    _kwargs["json"] = body.to_dict()


    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> SearchProviderYouTubeMusicResponse200 | SearchProviderYouTubeMusicResponse500 | None:
    if response.status_code == 200:
        response_200 = SearchProviderYouTubeMusicResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 500:
        response_500 = SearchProviderYouTubeMusicResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[SearchProviderYouTubeMusicResponse200 | SearchProviderYouTubeMusicResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: SearchProviderYouTubeMusicBody,

) -> Response[SearchProviderYouTubeMusicResponse200 | SearchProviderYouTubeMusicResponse500]:
    """ Search YouTube Music videos by track metadata

    Args:
        body (SearchProviderYouTubeMusicBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[SearchProviderYouTubeMusicResponse200 | SearchProviderYouTubeMusicResponse500]
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
    body: SearchProviderYouTubeMusicBody,

) -> SearchProviderYouTubeMusicResponse200 | SearchProviderYouTubeMusicResponse500 | None:
    """ Search YouTube Music videos by track metadata

    Args:
        body (SearchProviderYouTubeMusicBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        SearchProviderYouTubeMusicResponse200 | SearchProviderYouTubeMusicResponse500
     """


    return sync_detailed(
        client=client,
body=body,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: SearchProviderYouTubeMusicBody,

) -> Response[SearchProviderYouTubeMusicResponse200 | SearchProviderYouTubeMusicResponse500]:
    """ Search YouTube Music videos by track metadata

    Args:
        body (SearchProviderYouTubeMusicBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[SearchProviderYouTubeMusicResponse200 | SearchProviderYouTubeMusicResponse500]
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
    body: SearchProviderYouTubeMusicBody,

) -> SearchProviderYouTubeMusicResponse200 | SearchProviderYouTubeMusicResponse500 | None:
    """ Search YouTube Music videos by track metadata

    Args:
        body (SearchProviderYouTubeMusicBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        SearchProviderYouTubeMusicResponse200 | SearchProviderYouTubeMusicResponse500
     """


    return (await asyncio_detailed(
        client=client,
body=body,

    )).parsed
