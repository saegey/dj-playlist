from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.post_api_tracks_analyze_async_body import PostApiTracksAnalyzeAsyncBody
from ...models.post_api_tracks_analyze_async_response_200 import PostApiTracksAnalyzeAsyncResponse200
from ...models.post_api_tracks_analyze_async_response_400 import PostApiTracksAnalyzeAsyncResponse400
from ...models.post_api_tracks_analyze_async_response_500 import PostApiTracksAnalyzeAsyncResponse500
from typing import cast



def _get_kwargs(
    *,
    body: PostApiTracksAnalyzeAsyncBody,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/tracks/analyze-async",
    }

    _kwargs["json"] = body.to_dict()


    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> PostApiTracksAnalyzeAsyncResponse200 | PostApiTracksAnalyzeAsyncResponse400 | PostApiTracksAnalyzeAsyncResponse500 | None:
    if response.status_code == 200:
        response_200 = PostApiTracksAnalyzeAsyncResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = PostApiTracksAnalyzeAsyncResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 500:
        response_500 = PostApiTracksAnalyzeAsyncResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[PostApiTracksAnalyzeAsyncResponse200 | PostApiTracksAnalyzeAsyncResponse400 | PostApiTracksAnalyzeAsyncResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: PostApiTracksAnalyzeAsyncBody,

) -> Response[PostApiTracksAnalyzeAsyncResponse200 | PostApiTracksAnalyzeAsyncResponse400 | PostApiTracksAnalyzeAsyncResponse500]:
    """ Queue async track analysis

    Args:
        body (PostApiTracksAnalyzeAsyncBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[PostApiTracksAnalyzeAsyncResponse200 | PostApiTracksAnalyzeAsyncResponse400 | PostApiTracksAnalyzeAsyncResponse500]
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
    body: PostApiTracksAnalyzeAsyncBody,

) -> PostApiTracksAnalyzeAsyncResponse200 | PostApiTracksAnalyzeAsyncResponse400 | PostApiTracksAnalyzeAsyncResponse500 | None:
    """ Queue async track analysis

    Args:
        body (PostApiTracksAnalyzeAsyncBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        PostApiTracksAnalyzeAsyncResponse200 | PostApiTracksAnalyzeAsyncResponse400 | PostApiTracksAnalyzeAsyncResponse500
     """


    return sync_detailed(
        client=client,
body=body,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: PostApiTracksAnalyzeAsyncBody,

) -> Response[PostApiTracksAnalyzeAsyncResponse200 | PostApiTracksAnalyzeAsyncResponse400 | PostApiTracksAnalyzeAsyncResponse500]:
    """ Queue async track analysis

    Args:
        body (PostApiTracksAnalyzeAsyncBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[PostApiTracksAnalyzeAsyncResponse200 | PostApiTracksAnalyzeAsyncResponse400 | PostApiTracksAnalyzeAsyncResponse500]
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
    body: PostApiTracksAnalyzeAsyncBody,

) -> PostApiTracksAnalyzeAsyncResponse200 | PostApiTracksAnalyzeAsyncResponse400 | PostApiTracksAnalyzeAsyncResponse500 | None:
    """ Queue async track analysis

    Args:
        body (PostApiTracksAnalyzeAsyncBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        PostApiTracksAnalyzeAsyncResponse200 | PostApiTracksAnalyzeAsyncResponse400 | PostApiTracksAnalyzeAsyncResponse500
     """


    return (await asyncio_detailed(
        client=client,
body=body,

    )).parsed
