from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.run_gamdl_action_body import RunGamdlActionBody
from ...models.run_gamdl_action_response_200 import RunGamdlActionResponse200
from ...models.run_gamdl_action_response_400 import RunGamdlActionResponse400
from ...models.run_gamdl_action_response_500 import RunGamdlActionResponse500
from typing import cast



def _get_kwargs(
    *,
    body: RunGamdlActionBody,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/settings/gamdl/actions",
    }

    _kwargs["json"] = body.to_dict()


    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> RunGamdlActionResponse200 | RunGamdlActionResponse400 | RunGamdlActionResponse500 | None:
    if response.status_code == 200:
        response_200 = RunGamdlActionResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = RunGamdlActionResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 500:
        response_500 = RunGamdlActionResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[RunGamdlActionResponse200 | RunGamdlActionResponse400 | RunGamdlActionResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: RunGamdlActionBody,

) -> Response[RunGamdlActionResponse200 | RunGamdlActionResponse400 | RunGamdlActionResponse500]:
    """ Run GAMDL action (cookie_status, delete_cookie, test_connection, reset_settings)

    Args:
        body (RunGamdlActionBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[RunGamdlActionResponse200 | RunGamdlActionResponse400 | RunGamdlActionResponse500]
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
    body: RunGamdlActionBody,

) -> RunGamdlActionResponse200 | RunGamdlActionResponse400 | RunGamdlActionResponse500 | None:
    """ Run GAMDL action (cookie_status, delete_cookie, test_connection, reset_settings)

    Args:
        body (RunGamdlActionBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        RunGamdlActionResponse200 | RunGamdlActionResponse400 | RunGamdlActionResponse500
     """


    return sync_detailed(
        client=client,
body=body,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: RunGamdlActionBody,

) -> Response[RunGamdlActionResponse200 | RunGamdlActionResponse400 | RunGamdlActionResponse500]:
    """ Run GAMDL action (cookie_status, delete_cookie, test_connection, reset_settings)

    Args:
        body (RunGamdlActionBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[RunGamdlActionResponse200 | RunGamdlActionResponse400 | RunGamdlActionResponse500]
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
    body: RunGamdlActionBody,

) -> RunGamdlActionResponse200 | RunGamdlActionResponse400 | RunGamdlActionResponse500 | None:
    """ Run GAMDL action (cookie_status, delete_cookie, test_connection, reset_settings)

    Args:
        body (RunGamdlActionBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        RunGamdlActionResponse200 | RunGamdlActionResponse400 | RunGamdlActionResponse500
     """


    return (await asyncio_detailed(
        client=client,
body=body,

    )).parsed
