from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.upload_gamdl_cookie_file_body import UploadGamdlCookieFileBody
from ...models.upload_gamdl_cookie_file_response_200 import UploadGamdlCookieFileResponse200
from ...models.upload_gamdl_cookie_file_response_400 import UploadGamdlCookieFileResponse400
from typing import cast



def _get_kwargs(
    *,
    body: UploadGamdlCookieFileBody,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "put",
        "url": "/api/settings/gamdl-cookies",
    }

    _kwargs["files"] = body.to_multipart()



    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> UploadGamdlCookieFileResponse200 | UploadGamdlCookieFileResponse400 | None:
    if response.status_code == 200:
        response_200 = UploadGamdlCookieFileResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = UploadGamdlCookieFileResponse400.from_dict(response.json())



        return response_400

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[UploadGamdlCookieFileResponse200 | UploadGamdlCookieFileResponse400]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: UploadGamdlCookieFileBody,

) -> Response[UploadGamdlCookieFileResponse200 | UploadGamdlCookieFileResponse400]:
    """ Upload or replace GAMDL cookie file

    Args:
        body (UploadGamdlCookieFileBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[UploadGamdlCookieFileResponse200 | UploadGamdlCookieFileResponse400]
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
    body: UploadGamdlCookieFileBody,

) -> UploadGamdlCookieFileResponse200 | UploadGamdlCookieFileResponse400 | None:
    """ Upload or replace GAMDL cookie file

    Args:
        body (UploadGamdlCookieFileBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        UploadGamdlCookieFileResponse200 | UploadGamdlCookieFileResponse400
     """


    return sync_detailed(
        client=client,
body=body,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: UploadGamdlCookieFileBody,

) -> Response[UploadGamdlCookieFileResponse200 | UploadGamdlCookieFileResponse400]:
    """ Upload or replace GAMDL cookie file

    Args:
        body (UploadGamdlCookieFileBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[UploadGamdlCookieFileResponse200 | UploadGamdlCookieFileResponse400]
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
    body: UploadGamdlCookieFileBody,

) -> UploadGamdlCookieFileResponse200 | UploadGamdlCookieFileResponse400 | None:
    """ Upload or replace GAMDL cookie file

    Args:
        body (UploadGamdlCookieFileBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        UploadGamdlCookieFileResponse200 | UploadGamdlCookieFileResponse400
     """


    return (await asyncio_detailed(
        client=client,
body=body,

    )).parsed
