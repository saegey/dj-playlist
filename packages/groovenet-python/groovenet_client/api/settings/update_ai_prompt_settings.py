from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.update_ai_prompt_settings_body import UpdateAiPromptSettingsBody
from ...models.update_ai_prompt_settings_response_200 import UpdateAiPromptSettingsResponse200
from ...models.update_ai_prompt_settings_response_400 import UpdateAiPromptSettingsResponse400
from ...models.update_ai_prompt_settings_response_500 import UpdateAiPromptSettingsResponse500
from typing import cast



def _get_kwargs(
    *,
    body: UpdateAiPromptSettingsBody,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "put",
        "url": "/api/settings/ai-prompt",
    }

    _kwargs["json"] = body.to_dict()


    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> UpdateAiPromptSettingsResponse200 | UpdateAiPromptSettingsResponse400 | UpdateAiPromptSettingsResponse500 | None:
    if response.status_code == 200:
        response_200 = UpdateAiPromptSettingsResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = UpdateAiPromptSettingsResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 500:
        response_500 = UpdateAiPromptSettingsResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[UpdateAiPromptSettingsResponse200 | UpdateAiPromptSettingsResponse400 | UpdateAiPromptSettingsResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: UpdateAiPromptSettingsBody,

) -> Response[UpdateAiPromptSettingsResponse200 | UpdateAiPromptSettingsResponse400 | UpdateAiPromptSettingsResponse500]:
    """ Update AI metadata prompt settings

    Args:
        body (UpdateAiPromptSettingsBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[UpdateAiPromptSettingsResponse200 | UpdateAiPromptSettingsResponse400 | UpdateAiPromptSettingsResponse500]
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
    body: UpdateAiPromptSettingsBody,

) -> UpdateAiPromptSettingsResponse200 | UpdateAiPromptSettingsResponse400 | UpdateAiPromptSettingsResponse500 | None:
    """ Update AI metadata prompt settings

    Args:
        body (UpdateAiPromptSettingsBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        UpdateAiPromptSettingsResponse200 | UpdateAiPromptSettingsResponse400 | UpdateAiPromptSettingsResponse500
     """


    return sync_detailed(
        client=client,
body=body,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: UpdateAiPromptSettingsBody,

) -> Response[UpdateAiPromptSettingsResponse200 | UpdateAiPromptSettingsResponse400 | UpdateAiPromptSettingsResponse500]:
    """ Update AI metadata prompt settings

    Args:
        body (UpdateAiPromptSettingsBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[UpdateAiPromptSettingsResponse200 | UpdateAiPromptSettingsResponse400 | UpdateAiPromptSettingsResponse500]
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
    body: UpdateAiPromptSettingsBody,

) -> UpdateAiPromptSettingsResponse200 | UpdateAiPromptSettingsResponse400 | UpdateAiPromptSettingsResponse500 | None:
    """ Update AI metadata prompt settings

    Args:
        body (UpdateAiPromptSettingsBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        UpdateAiPromptSettingsResponse200 | UpdateAiPromptSettingsResponse400 | UpdateAiPromptSettingsResponse500
     """


    return (await asyncio_detailed(
        client=client,
body=body,

    )).parsed
