from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.add_friend_body import AddFriendBody
from ...models.add_friend_response_200 import AddFriendResponse200
from ...models.add_friend_response_400 import AddFriendResponse400
from ...models.add_friend_response_500 import AddFriendResponse500
from typing import cast



def _get_kwargs(
    *,
    body: AddFriendBody,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/friends",
    }

    _kwargs["json"] = body.to_dict()


    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> AddFriendResponse200 | AddFriendResponse400 | AddFriendResponse500 | None:
    if response.status_code == 200:
        response_200 = AddFriendResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = AddFriendResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 500:
        response_500 = AddFriendResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[AddFriendResponse200 | AddFriendResponse400 | AddFriendResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: AddFriendBody,

) -> Response[AddFriendResponse200 | AddFriendResponse400 | AddFriendResponse500]:
    """ Add a friend/library by username

    Args:
        body (AddFriendBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AddFriendResponse200 | AddFriendResponse400 | AddFriendResponse500]
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
    body: AddFriendBody,

) -> AddFriendResponse200 | AddFriendResponse400 | AddFriendResponse500 | None:
    """ Add a friend/library by username

    Args:
        body (AddFriendBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AddFriendResponse200 | AddFriendResponse400 | AddFriendResponse500
     """


    return sync_detailed(
        client=client,
body=body,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: AddFriendBody,

) -> Response[AddFriendResponse200 | AddFriendResponse400 | AddFriendResponse500]:
    """ Add a friend/library by username

    Args:
        body (AddFriendBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AddFriendResponse200 | AddFriendResponse400 | AddFriendResponse500]
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
    body: AddFriendBody,

) -> AddFriendResponse200 | AddFriendResponse400 | AddFriendResponse500 | None:
    """ Add a friend/library by username

    Args:
        body (AddFriendBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AddFriendResponse200 | AddFriendResponse400 | AddFriendResponse500
     """


    return (await asyncio_detailed(
        client=client,
body=body,

    )).parsed
