from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.get_gamdl_settings_response_200 import GetGamdlSettingsResponse200
from ...models.get_gamdl_settings_response_400 import GetGamdlSettingsResponse400
from ...models.get_gamdl_settings_response_500 import GetGamdlSettingsResponse500
from typing import cast



def _get_kwargs(
    *,
    friend_id: int,

) -> dict[str, Any]:
    

    

    params: dict[str, Any] = {}

    params["friend_id"] = friend_id


    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}


    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/settings/gamdl",
        "params": params,
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> GetGamdlSettingsResponse200 | GetGamdlSettingsResponse400 | GetGamdlSettingsResponse500 | None:
    if response.status_code == 200:
        response_200 = GetGamdlSettingsResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = GetGamdlSettingsResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 500:
        response_500 = GetGamdlSettingsResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[GetGamdlSettingsResponse200 | GetGamdlSettingsResponse400 | GetGamdlSettingsResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    friend_id: int,

) -> Response[GetGamdlSettingsResponse200 | GetGamdlSettingsResponse400 | GetGamdlSettingsResponse500]:
    """ Get GAMDL settings for a friend

    Args:
        friend_id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[GetGamdlSettingsResponse200 | GetGamdlSettingsResponse400 | GetGamdlSettingsResponse500]
     """


    kwargs = _get_kwargs(
        friend_id=friend_id,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    *,
    client: AuthenticatedClient | Client,
    friend_id: int,

) -> GetGamdlSettingsResponse200 | GetGamdlSettingsResponse400 | GetGamdlSettingsResponse500 | None:
    """ Get GAMDL settings for a friend

    Args:
        friend_id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        GetGamdlSettingsResponse200 | GetGamdlSettingsResponse400 | GetGamdlSettingsResponse500
     """


    return sync_detailed(
        client=client,
friend_id=friend_id,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    friend_id: int,

) -> Response[GetGamdlSettingsResponse200 | GetGamdlSettingsResponse400 | GetGamdlSettingsResponse500]:
    """ Get GAMDL settings for a friend

    Args:
        friend_id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[GetGamdlSettingsResponse200 | GetGamdlSettingsResponse400 | GetGamdlSettingsResponse500]
     """


    kwargs = _get_kwargs(
        friend_id=friend_id,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    *,
    client: AuthenticatedClient | Client,
    friend_id: int,

) -> GetGamdlSettingsResponse200 | GetGamdlSettingsResponse400 | GetGamdlSettingsResponse500 | None:
    """ Get GAMDL settings for a friend

    Args:
        friend_id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        GetGamdlSettingsResponse200 | GetGamdlSettingsResponse400 | GetGamdlSettingsResponse500
     """


    return (await asyncio_detailed(
        client=client,
friend_id=friend_id,

    )).parsed
