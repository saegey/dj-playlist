from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.list_friends_response_200 import ListFriendsResponse200
from ...models.list_friends_response_500 import ListFriendsResponse500
from ...types import UNSET, Unset
from typing import cast



def _get_kwargs(
    *,
    show_current_user: bool | Unset = UNSET,

) -> dict[str, Any]:
    

    

    params: dict[str, Any] = {}

    params["showCurrentUser"] = show_current_user


    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}


    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/friends",
        "params": params,
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> ListFriendsResponse200 | ListFriendsResponse500 | None:
    if response.status_code == 200:
        response_200 = ListFriendsResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 500:
        response_500 = ListFriendsResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[ListFriendsResponse200 | ListFriendsResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    show_current_user: bool | Unset = UNSET,

) -> Response[ListFriendsResponse200 | ListFriendsResponse500]:
    """ List friends/libraries

    Args:
        show_current_user (bool | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ListFriendsResponse200 | ListFriendsResponse500]
     """


    kwargs = _get_kwargs(
        show_current_user=show_current_user,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    *,
    client: AuthenticatedClient | Client,
    show_current_user: bool | Unset = UNSET,

) -> ListFriendsResponse200 | ListFriendsResponse500 | None:
    """ List friends/libraries

    Args:
        show_current_user (bool | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ListFriendsResponse200 | ListFriendsResponse500
     """


    return sync_detailed(
        client=client,
show_current_user=show_current_user,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    show_current_user: bool | Unset = UNSET,

) -> Response[ListFriendsResponse200 | ListFriendsResponse500]:
    """ List friends/libraries

    Args:
        show_current_user (bool | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ListFriendsResponse200 | ListFriendsResponse500]
     """


    kwargs = _get_kwargs(
        show_current_user=show_current_user,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    *,
    client: AuthenticatedClient | Client,
    show_current_user: bool | Unset = UNSET,

) -> ListFriendsResponse200 | ListFriendsResponse500 | None:
    """ List friends/libraries

    Args:
        show_current_user (bool | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ListFriendsResponse200 | ListFriendsResponse500
     """


    return (await asyncio_detailed(
        client=client,
show_current_user=show_current_user,

    )).parsed
