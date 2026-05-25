from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.get_ai_prompt_settings_response_200 import GetAiPromptSettingsResponse200
from ...models.get_ai_prompt_settings_response_400 import GetAiPromptSettingsResponse400
from ...models.get_ai_prompt_settings_response_500 import GetAiPromptSettingsResponse500
from ...types import UNSET, Unset
from typing import cast



def _get_kwargs(
    *,
    friend_id: int | Unset = UNSET,

) -> dict[str, Any]:
    

    

    params: dict[str, Any] = {}

    params["friend_id"] = friend_id


    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}


    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/settings/ai-prompt",
        "params": params,
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> GetAiPromptSettingsResponse200 | GetAiPromptSettingsResponse400 | GetAiPromptSettingsResponse500 | None:
    if response.status_code == 200:
        response_200 = GetAiPromptSettingsResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = GetAiPromptSettingsResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 500:
        response_500 = GetAiPromptSettingsResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[GetAiPromptSettingsResponse200 | GetAiPromptSettingsResponse400 | GetAiPromptSettingsResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    friend_id: int | Unset = UNSET,

) -> Response[GetAiPromptSettingsResponse200 | GetAiPromptSettingsResponse400 | GetAiPromptSettingsResponse500]:
    """ Get AI metadata prompt settings

    Args:
        friend_id (int | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[GetAiPromptSettingsResponse200 | GetAiPromptSettingsResponse400 | GetAiPromptSettingsResponse500]
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
    friend_id: int | Unset = UNSET,

) -> GetAiPromptSettingsResponse200 | GetAiPromptSettingsResponse400 | GetAiPromptSettingsResponse500 | None:
    """ Get AI metadata prompt settings

    Args:
        friend_id (int | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        GetAiPromptSettingsResponse200 | GetAiPromptSettingsResponse400 | GetAiPromptSettingsResponse500
     """


    return sync_detailed(
        client=client,
friend_id=friend_id,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    friend_id: int | Unset = UNSET,

) -> Response[GetAiPromptSettingsResponse200 | GetAiPromptSettingsResponse400 | GetAiPromptSettingsResponse500]:
    """ Get AI metadata prompt settings

    Args:
        friend_id (int | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[GetAiPromptSettingsResponse200 | GetAiPromptSettingsResponse400 | GetAiPromptSettingsResponse500]
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
    friend_id: int | Unset = UNSET,

) -> GetAiPromptSettingsResponse200 | GetAiPromptSettingsResponse400 | GetAiPromptSettingsResponse500 | None:
    """ Get AI metadata prompt settings

    Args:
        friend_id (int | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        GetAiPromptSettingsResponse200 | GetAiPromptSettingsResponse400 | GetAiPromptSettingsResponse500
     """


    return (await asyncio_detailed(
        client=client,
friend_id=friend_id,

    )).parsed
