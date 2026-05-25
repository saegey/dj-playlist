from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.post_api_tracks_batch_body import PostApiTracksBatchBody
from ...models.post_api_tracks_batch_response_200_item import PostApiTracksBatchResponse200Item
from ...models.post_api_tracks_batch_response_500 import PostApiTracksBatchResponse500
from typing import cast



def _get_kwargs(
    *,
    body: PostApiTracksBatchBody,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/tracks/batch",
    }

    _kwargs["json"] = body.to_dict()


    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> PostApiTracksBatchResponse500 | list[PostApiTracksBatchResponse200Item] | None:
    if response.status_code == 200:
        response_200 = []
        _response_200 = response.json()
        for response_200_item_data in (_response_200):
            response_200_item = PostApiTracksBatchResponse200Item.from_dict(response_200_item_data)



            response_200.append(response_200_item)

        return response_200

    if response.status_code == 500:
        response_500 = PostApiTracksBatchResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[PostApiTracksBatchResponse500 | list[PostApiTracksBatchResponse200Item]]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: PostApiTracksBatchBody,

) -> Response[PostApiTracksBatchResponse500 | list[PostApiTracksBatchResponse200Item]]:
    """ Fetch ordered batch of tracks

    Args:
        body (PostApiTracksBatchBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[PostApiTracksBatchResponse500 | list[PostApiTracksBatchResponse200Item]]
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
    body: PostApiTracksBatchBody,

) -> PostApiTracksBatchResponse500 | list[PostApiTracksBatchResponse200Item] | None:
    """ Fetch ordered batch of tracks

    Args:
        body (PostApiTracksBatchBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        PostApiTracksBatchResponse500 | list[PostApiTracksBatchResponse200Item]
     """


    return sync_detailed(
        client=client,
body=body,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: PostApiTracksBatchBody,

) -> Response[PostApiTracksBatchResponse500 | list[PostApiTracksBatchResponse200Item]]:
    """ Fetch ordered batch of tracks

    Args:
        body (PostApiTracksBatchBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[PostApiTracksBatchResponse500 | list[PostApiTracksBatchResponse200Item]]
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
    body: PostApiTracksBatchBody,

) -> PostApiTracksBatchResponse500 | list[PostApiTracksBatchResponse200Item] | None:
    """ Fetch ordered batch of tracks

    Args:
        body (PostApiTracksBatchBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        PostApiTracksBatchResponse500 | list[PostApiTracksBatchResponse200Item]
     """


    return (await asyncio_detailed(
        client=client,
body=body,

    )).parsed
