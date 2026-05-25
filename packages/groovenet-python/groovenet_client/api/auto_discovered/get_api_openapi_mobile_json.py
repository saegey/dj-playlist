from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.get_api_openapi_mobile_json_response_200 import GetApiOpenapiMobileJsonResponse200
from ...models.get_api_openapi_mobile_json_response_500 import GetApiOpenapiMobileJsonResponse500
from typing import cast



def _get_kwargs(
    
) -> dict[str, Any]:
    

    

    

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/openapi.mobile.json",
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> GetApiOpenapiMobileJsonResponse200 | GetApiOpenapiMobileJsonResponse500 | None:
    if response.status_code == 200:
        response_200 = GetApiOpenapiMobileJsonResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 500:
        response_500 = GetApiOpenapiMobileJsonResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[GetApiOpenapiMobileJsonResponse200 | GetApiOpenapiMobileJsonResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,

) -> Response[GetApiOpenapiMobileJsonResponse200 | GetApiOpenapiMobileJsonResponse500]:
    """ Auto-discovered GET /api/openapi.mobile.json

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[GetApiOpenapiMobileJsonResponse200 | GetApiOpenapiMobileJsonResponse500]
     """


    kwargs = _get_kwargs(
        
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    *,
    client: AuthenticatedClient | Client,

) -> GetApiOpenapiMobileJsonResponse200 | GetApiOpenapiMobileJsonResponse500 | None:
    """ Auto-discovered GET /api/openapi.mobile.json

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        GetApiOpenapiMobileJsonResponse200 | GetApiOpenapiMobileJsonResponse500
     """


    return sync_detailed(
        client=client,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,

) -> Response[GetApiOpenapiMobileJsonResponse200 | GetApiOpenapiMobileJsonResponse500]:
    """ Auto-discovered GET /api/openapi.mobile.json

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[GetApiOpenapiMobileJsonResponse200 | GetApiOpenapiMobileJsonResponse500]
     """


    kwargs = _get_kwargs(
        
    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    *,
    client: AuthenticatedClient | Client,

) -> GetApiOpenapiMobileJsonResponse200 | GetApiOpenapiMobileJsonResponse500 | None:
    """ Auto-discovered GET /api/openapi.mobile.json

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        GetApiOpenapiMobileJsonResponse200 | GetApiOpenapiMobileJsonResponse500
     """


    return (await asyncio_detailed(
        client=client,

    )).parsed
