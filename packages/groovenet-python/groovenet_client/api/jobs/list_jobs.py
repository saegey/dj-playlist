from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.list_jobs_response_200 import ListJobsResponse200
from ...models.list_jobs_response_500 import ListJobsResponse500
from ...models.list_jobs_state import ListJobsState
from ...types import UNSET, Unset
from typing import cast



def _get_kwargs(
    *,
    limit: int | Unset = 100,
    offset: int | Unset = 0,
    state: ListJobsState | Unset = ListJobsState.ALL,

) -> dict[str, Any]:
    

    

    params: dict[str, Any] = {}

    params["limit"] = limit

    params["offset"] = offset

    json_state: str | Unset = UNSET
    if not isinstance(state, Unset):
        json_state = state.value

    params["state"] = json_state


    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}


    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/jobs",
        "params": params,
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> ListJobsResponse200 | ListJobsResponse500 | None:
    if response.status_code == 200:
        response_200 = ListJobsResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 500:
        response_500 = ListJobsResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[ListJobsResponse200 | ListJobsResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    limit: int | Unset = 100,
    offset: int | Unset = 0,
    state: ListJobsState | Unset = ListJobsState.ALL,

) -> Response[ListJobsResponse200 | ListJobsResponse500]:
    """ List background jobs

    Args:
        limit (int | Unset):  Default: 100.
        offset (int | Unset):  Default: 0.
        state (ListJobsState | Unset):  Default: ListJobsState.ALL.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ListJobsResponse200 | ListJobsResponse500]
     """


    kwargs = _get_kwargs(
        limit=limit,
offset=offset,
state=state,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    *,
    client: AuthenticatedClient | Client,
    limit: int | Unset = 100,
    offset: int | Unset = 0,
    state: ListJobsState | Unset = ListJobsState.ALL,

) -> ListJobsResponse200 | ListJobsResponse500 | None:
    """ List background jobs

    Args:
        limit (int | Unset):  Default: 100.
        offset (int | Unset):  Default: 0.
        state (ListJobsState | Unset):  Default: ListJobsState.ALL.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ListJobsResponse200 | ListJobsResponse500
     """


    return sync_detailed(
        client=client,
limit=limit,
offset=offset,
state=state,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    limit: int | Unset = 100,
    offset: int | Unset = 0,
    state: ListJobsState | Unset = ListJobsState.ALL,

) -> Response[ListJobsResponse200 | ListJobsResponse500]:
    """ List background jobs

    Args:
        limit (int | Unset):  Default: 100.
        offset (int | Unset):  Default: 0.
        state (ListJobsState | Unset):  Default: ListJobsState.ALL.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ListJobsResponse200 | ListJobsResponse500]
     """


    kwargs = _get_kwargs(
        limit=limit,
offset=offset,
state=state,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    *,
    client: AuthenticatedClient | Client,
    limit: int | Unset = 100,
    offset: int | Unset = 0,
    state: ListJobsState | Unset = ListJobsState.ALL,

) -> ListJobsResponse200 | ListJobsResponse500 | None:
    """ List background jobs

    Args:
        limit (int | Unset):  Default: 100.
        offset (int | Unset):  Default: 0.
        state (ListJobsState | Unset):  Default: ListJobsState.ALL.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ListJobsResponse200 | ListJobsResponse500
     """


    return (await asyncio_detailed(
        client=client,
limit=limit,
offset=offset,
state=state,

    )).parsed
