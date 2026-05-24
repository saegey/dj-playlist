from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.lookup_provider_discogs_release_response_200 import LookupProviderDiscogsReleaseResponse200
from ...models.lookup_provider_discogs_release_response_400 import LookupProviderDiscogsReleaseResponse400
from ...models.lookup_provider_discogs_release_response_404 import LookupProviderDiscogsReleaseResponse404
from ...models.lookup_provider_discogs_release_response_500 import LookupProviderDiscogsReleaseResponse500
from ...types import UNSET, Unset
from typing import cast



def _get_kwargs(
    *,
    track_id: str,
    username: str | Unset = UNSET,
    friend_id: int | Unset = UNSET,

) -> dict[str, Any]:
    

    

    params: dict[str, Any] = {}

    params["track_id"] = track_id

    params["username"] = username

    params["friend_id"] = friend_id


    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}


    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/providers/discogs/release-lookup",
        "params": params,
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> LookupProviderDiscogsReleaseResponse200 | LookupProviderDiscogsReleaseResponse400 | LookupProviderDiscogsReleaseResponse404 | LookupProviderDiscogsReleaseResponse500 | None:
    if response.status_code == 200:
        response_200 = LookupProviderDiscogsReleaseResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = LookupProviderDiscogsReleaseResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 404:
        response_404 = LookupProviderDiscogsReleaseResponse404.from_dict(response.json())



        return response_404

    if response.status_code == 500:
        response_500 = LookupProviderDiscogsReleaseResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[LookupProviderDiscogsReleaseResponse200 | LookupProviderDiscogsReleaseResponse400 | LookupProviderDiscogsReleaseResponse404 | LookupProviderDiscogsReleaseResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    track_id: str,
    username: str | Unset = UNSET,
    friend_id: int | Unset = UNSET,

) -> Response[LookupProviderDiscogsReleaseResponse200 | LookupProviderDiscogsReleaseResponse400 | LookupProviderDiscogsReleaseResponse404 | LookupProviderDiscogsReleaseResponse500]:
    """ Lookup Discogs release JSON and matched track by track_id

    Args:
        track_id (str):
        username (str | Unset):
        friend_id (int | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[LookupProviderDiscogsReleaseResponse200 | LookupProviderDiscogsReleaseResponse400 | LookupProviderDiscogsReleaseResponse404 | LookupProviderDiscogsReleaseResponse500]
     """


    kwargs = _get_kwargs(
        track_id=track_id,
username=username,
friend_id=friend_id,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    *,
    client: AuthenticatedClient | Client,
    track_id: str,
    username: str | Unset = UNSET,
    friend_id: int | Unset = UNSET,

) -> LookupProviderDiscogsReleaseResponse200 | LookupProviderDiscogsReleaseResponse400 | LookupProviderDiscogsReleaseResponse404 | LookupProviderDiscogsReleaseResponse500 | None:
    """ Lookup Discogs release JSON and matched track by track_id

    Args:
        track_id (str):
        username (str | Unset):
        friend_id (int | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        LookupProviderDiscogsReleaseResponse200 | LookupProviderDiscogsReleaseResponse400 | LookupProviderDiscogsReleaseResponse404 | LookupProviderDiscogsReleaseResponse500
     """


    return sync_detailed(
        client=client,
track_id=track_id,
username=username,
friend_id=friend_id,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    track_id: str,
    username: str | Unset = UNSET,
    friend_id: int | Unset = UNSET,

) -> Response[LookupProviderDiscogsReleaseResponse200 | LookupProviderDiscogsReleaseResponse400 | LookupProviderDiscogsReleaseResponse404 | LookupProviderDiscogsReleaseResponse500]:
    """ Lookup Discogs release JSON and matched track by track_id

    Args:
        track_id (str):
        username (str | Unset):
        friend_id (int | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[LookupProviderDiscogsReleaseResponse200 | LookupProviderDiscogsReleaseResponse400 | LookupProviderDiscogsReleaseResponse404 | LookupProviderDiscogsReleaseResponse500]
     """


    kwargs = _get_kwargs(
        track_id=track_id,
username=username,
friend_id=friend_id,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    *,
    client: AuthenticatedClient | Client,
    track_id: str,
    username: str | Unset = UNSET,
    friend_id: int | Unset = UNSET,

) -> LookupProviderDiscogsReleaseResponse200 | LookupProviderDiscogsReleaseResponse400 | LookupProviderDiscogsReleaseResponse404 | LookupProviderDiscogsReleaseResponse500 | None:
    """ Lookup Discogs release JSON and matched track by track_id

    Args:
        track_id (str):
        username (str | Unset):
        friend_id (int | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        LookupProviderDiscogsReleaseResponse200 | LookupProviderDiscogsReleaseResponse400 | LookupProviderDiscogsReleaseResponse404 | LookupProviderDiscogsReleaseResponse500
     """


    return (await asyncio_detailed(
        client=client,
track_id=track_id,
username=username,
friend_id=friend_id,

    )).parsed
