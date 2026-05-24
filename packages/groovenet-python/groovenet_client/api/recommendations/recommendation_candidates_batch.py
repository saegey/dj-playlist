from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.recommendation_candidates_batch_body import RecommendationCandidatesBatchBody
from ...models.recommendation_candidates_batch_response_200 import RecommendationCandidatesBatchResponse200
from ...models.recommendation_candidates_batch_response_400 import RecommendationCandidatesBatchResponse400
from ...models.recommendation_candidates_batch_response_404 import RecommendationCandidatesBatchResponse404
from ...models.recommendation_candidates_batch_response_500 import RecommendationCandidatesBatchResponse500
from typing import cast



def _get_kwargs(
    *,
    body: RecommendationCandidatesBatchBody,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/recommendations/candidates",
    }

    _kwargs["json"] = body.to_dict()


    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> RecommendationCandidatesBatchResponse200 | RecommendationCandidatesBatchResponse400 | RecommendationCandidatesBatchResponse404 | RecommendationCandidatesBatchResponse500 | None:
    if response.status_code == 200:
        response_200 = RecommendationCandidatesBatchResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = RecommendationCandidatesBatchResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 404:
        response_404 = RecommendationCandidatesBatchResponse404.from_dict(response.json())



        return response_404

    if response.status_code == 500:
        response_500 = RecommendationCandidatesBatchResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[RecommendationCandidatesBatchResponse200 | RecommendationCandidatesBatchResponse400 | RecommendationCandidatesBatchResponse404 | RecommendationCandidatesBatchResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: RecommendationCandidatesBatchBody,

) -> Response[RecommendationCandidatesBatchResponse200 | RecommendationCandidatesBatchResponse400 | RecommendationCandidatesBatchResponse404 | RecommendationCandidatesBatchResponse500]:
    """ Get recommendation candidates from multiple seed tracks

    Args:
        body (RecommendationCandidatesBatchBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[RecommendationCandidatesBatchResponse200 | RecommendationCandidatesBatchResponse400 | RecommendationCandidatesBatchResponse404 | RecommendationCandidatesBatchResponse500]
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
    body: RecommendationCandidatesBatchBody,

) -> RecommendationCandidatesBatchResponse200 | RecommendationCandidatesBatchResponse400 | RecommendationCandidatesBatchResponse404 | RecommendationCandidatesBatchResponse500 | None:
    """ Get recommendation candidates from multiple seed tracks

    Args:
        body (RecommendationCandidatesBatchBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        RecommendationCandidatesBatchResponse200 | RecommendationCandidatesBatchResponse400 | RecommendationCandidatesBatchResponse404 | RecommendationCandidatesBatchResponse500
     """


    return sync_detailed(
        client=client,
body=body,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: RecommendationCandidatesBatchBody,

) -> Response[RecommendationCandidatesBatchResponse200 | RecommendationCandidatesBatchResponse400 | RecommendationCandidatesBatchResponse404 | RecommendationCandidatesBatchResponse500]:
    """ Get recommendation candidates from multiple seed tracks

    Args:
        body (RecommendationCandidatesBatchBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[RecommendationCandidatesBatchResponse200 | RecommendationCandidatesBatchResponse400 | RecommendationCandidatesBatchResponse404 | RecommendationCandidatesBatchResponse500]
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
    body: RecommendationCandidatesBatchBody,

) -> RecommendationCandidatesBatchResponse200 | RecommendationCandidatesBatchResponse400 | RecommendationCandidatesBatchResponse404 | RecommendationCandidatesBatchResponse500 | None:
    """ Get recommendation candidates from multiple seed tracks

    Args:
        body (RecommendationCandidatesBatchBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        RecommendationCandidatesBatchResponse200 | RecommendationCandidatesBatchResponse400 | RecommendationCandidatesBatchResponse404 | RecommendationCandidatesBatchResponse500
     """


    return (await asyncio_detailed(
        client=client,
body=body,

    )).parsed
