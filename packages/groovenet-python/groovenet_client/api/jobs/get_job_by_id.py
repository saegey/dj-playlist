from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.get_job_by_id_response_400 import GetJobByIdResponse400
from ...models.get_job_by_id_response_404 import GetJobByIdResponse404
from ...models.get_job_by_id_response_500 import GetJobByIdResponse500
from typing import cast



def _get_kwargs(
    job_id: str,

) -> dict[str, Any]:
    

    

    

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/jobs/{job_id}".format(job_id=quote(str(job_id), safe=""),),
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> GetJobByIdResponse400 | GetJobByIdResponse404 | GetJobByIdResponse500 | None:
    if response.status_code == 400:
        response_400 = GetJobByIdResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 404:
        response_404 = GetJobByIdResponse404.from_dict(response.json())



        return response_404

    if response.status_code == 500:
        response_500 = GetJobByIdResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[GetJobByIdResponse400 | GetJobByIdResponse404 | GetJobByIdResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    job_id: str,
    *,
    client: AuthenticatedClient | Client,

) -> Response[GetJobByIdResponse400 | GetJobByIdResponse404 | GetJobByIdResponse500]:
    """ Get a single job status by id

    Args:
        job_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[GetJobByIdResponse400 | GetJobByIdResponse404 | GetJobByIdResponse500]
     """


    kwargs = _get_kwargs(
        job_id=job_id,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    job_id: str,
    *,
    client: AuthenticatedClient | Client,

) -> GetJobByIdResponse400 | GetJobByIdResponse404 | GetJobByIdResponse500 | None:
    """ Get a single job status by id

    Args:
        job_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        GetJobByIdResponse400 | GetJobByIdResponse404 | GetJobByIdResponse500
     """


    return sync_detailed(
        job_id=job_id,
client=client,

    ).parsed

async def asyncio_detailed(
    job_id: str,
    *,
    client: AuthenticatedClient | Client,

) -> Response[GetJobByIdResponse400 | GetJobByIdResponse404 | GetJobByIdResponse500]:
    """ Get a single job status by id

    Args:
        job_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[GetJobByIdResponse400 | GetJobByIdResponse404 | GetJobByIdResponse500]
     """


    kwargs = _get_kwargs(
        job_id=job_id,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    job_id: str,
    *,
    client: AuthenticatedClient | Client,

) -> GetJobByIdResponse400 | GetJobByIdResponse404 | GetJobByIdResponse500 | None:
    """ Get a single job status by id

    Args:
        job_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        GetJobByIdResponse400 | GetJobByIdResponse404 | GetJobByIdResponse500
     """


    return (await asyncio_detailed(
        job_id=job_id,
client=client,

    )).parsed
