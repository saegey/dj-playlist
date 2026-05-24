from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.recommendation_candidates_mode import RecommendationCandidatesMode
from ...models.recommendation_candidates_response_200 import RecommendationCandidatesResponse200
from ...models.recommendation_candidates_response_400 import RecommendationCandidatesResponse400
from ...models.recommendation_candidates_response_404 import RecommendationCandidatesResponse404
from ...models.recommendation_candidates_response_500 import RecommendationCandidatesResponse500
from ...types import UNSET, Unset
from typing import cast



def _get_kwargs(
    *,
    track_id: str,
    friend_id: int,
    mode: RecommendationCandidatesMode | Unset = RecommendationCandidatesMode.COMBINED,
    limit_identity: int | Unset = 200,
    limit_audio: int | Unset = 200,
    ivfflat_probes: int | Unset = 10,

) -> dict[str, Any]:
    

    

    params: dict[str, Any] = {}

    params["track_id"] = track_id

    params["friend_id"] = friend_id

    json_mode: str | Unset = UNSET
    if not isinstance(mode, Unset):
        json_mode = mode.value

    params["mode"] = json_mode

    params["limit_identity"] = limit_identity

    params["limit_audio"] = limit_audio

    params["ivfflat_probes"] = ivfflat_probes


    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}


    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/recommendations/candidates",
        "params": params,
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> RecommendationCandidatesResponse200 | RecommendationCandidatesResponse400 | RecommendationCandidatesResponse404 | RecommendationCandidatesResponse500 | None:
    if response.status_code == 200:
        response_200 = RecommendationCandidatesResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = RecommendationCandidatesResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 404:
        response_404 = RecommendationCandidatesResponse404.from_dict(response.json())



        return response_404

    if response.status_code == 500:
        response_500 = RecommendationCandidatesResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[RecommendationCandidatesResponse200 | RecommendationCandidatesResponse400 | RecommendationCandidatesResponse404 | RecommendationCandidatesResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    track_id: str,
    friend_id: int,
    mode: RecommendationCandidatesMode | Unset = RecommendationCandidatesMode.COMBINED,
    limit_identity: int | Unset = 200,
    limit_audio: int | Unset = 200,
    ivfflat_probes: int | Unset = 10,

) -> Response[RecommendationCandidatesResponse200 | RecommendationCandidatesResponse400 | RecommendationCandidatesResponse404 | RecommendationCandidatesResponse500]:
    """ Get recommendation candidates (combined, identity-only, or audio-only)

    Args:
        track_id (str):
        friend_id (int):
        mode (RecommendationCandidatesMode | Unset):  Default:
            RecommendationCandidatesMode.COMBINED.
        limit_identity (int | Unset):  Default: 200.
        limit_audio (int | Unset):  Default: 200.
        ivfflat_probes (int | Unset):  Default: 10.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[RecommendationCandidatesResponse200 | RecommendationCandidatesResponse400 | RecommendationCandidatesResponse404 | RecommendationCandidatesResponse500]
     """


    kwargs = _get_kwargs(
        track_id=track_id,
friend_id=friend_id,
mode=mode,
limit_identity=limit_identity,
limit_audio=limit_audio,
ivfflat_probes=ivfflat_probes,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    *,
    client: AuthenticatedClient | Client,
    track_id: str,
    friend_id: int,
    mode: RecommendationCandidatesMode | Unset = RecommendationCandidatesMode.COMBINED,
    limit_identity: int | Unset = 200,
    limit_audio: int | Unset = 200,
    ivfflat_probes: int | Unset = 10,

) -> RecommendationCandidatesResponse200 | RecommendationCandidatesResponse400 | RecommendationCandidatesResponse404 | RecommendationCandidatesResponse500 | None:
    """ Get recommendation candidates (combined, identity-only, or audio-only)

    Args:
        track_id (str):
        friend_id (int):
        mode (RecommendationCandidatesMode | Unset):  Default:
            RecommendationCandidatesMode.COMBINED.
        limit_identity (int | Unset):  Default: 200.
        limit_audio (int | Unset):  Default: 200.
        ivfflat_probes (int | Unset):  Default: 10.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        RecommendationCandidatesResponse200 | RecommendationCandidatesResponse400 | RecommendationCandidatesResponse404 | RecommendationCandidatesResponse500
     """


    return sync_detailed(
        client=client,
track_id=track_id,
friend_id=friend_id,
mode=mode,
limit_identity=limit_identity,
limit_audio=limit_audio,
ivfflat_probes=ivfflat_probes,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    track_id: str,
    friend_id: int,
    mode: RecommendationCandidatesMode | Unset = RecommendationCandidatesMode.COMBINED,
    limit_identity: int | Unset = 200,
    limit_audio: int | Unset = 200,
    ivfflat_probes: int | Unset = 10,

) -> Response[RecommendationCandidatesResponse200 | RecommendationCandidatesResponse400 | RecommendationCandidatesResponse404 | RecommendationCandidatesResponse500]:
    """ Get recommendation candidates (combined, identity-only, or audio-only)

    Args:
        track_id (str):
        friend_id (int):
        mode (RecommendationCandidatesMode | Unset):  Default:
            RecommendationCandidatesMode.COMBINED.
        limit_identity (int | Unset):  Default: 200.
        limit_audio (int | Unset):  Default: 200.
        ivfflat_probes (int | Unset):  Default: 10.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[RecommendationCandidatesResponse200 | RecommendationCandidatesResponse400 | RecommendationCandidatesResponse404 | RecommendationCandidatesResponse500]
     """


    kwargs = _get_kwargs(
        track_id=track_id,
friend_id=friend_id,
mode=mode,
limit_identity=limit_identity,
limit_audio=limit_audio,
ivfflat_probes=ivfflat_probes,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    *,
    client: AuthenticatedClient | Client,
    track_id: str,
    friend_id: int,
    mode: RecommendationCandidatesMode | Unset = RecommendationCandidatesMode.COMBINED,
    limit_identity: int | Unset = 200,
    limit_audio: int | Unset = 200,
    ivfflat_probes: int | Unset = 10,

) -> RecommendationCandidatesResponse200 | RecommendationCandidatesResponse400 | RecommendationCandidatesResponse404 | RecommendationCandidatesResponse500 | None:
    """ Get recommendation candidates (combined, identity-only, or audio-only)

    Args:
        track_id (str):
        friend_id (int):
        mode (RecommendationCandidatesMode | Unset):  Default:
            RecommendationCandidatesMode.COMBINED.
        limit_identity (int | Unset):  Default: 200.
        limit_audio (int | Unset):  Default: 200.
        ivfflat_probes (int | Unset):  Default: 10.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        RecommendationCandidatesResponse200 | RecommendationCandidatesResponse400 | RecommendationCandidatesResponse404 | RecommendationCandidatesResponse500
     """


    return (await asyncio_detailed(
        client=client,
track_id=track_id,
friend_id=friend_id,
mode=mode,
limit_identity=limit_identity,
limit_audio=limit_audio,
ivfflat_probes=ivfflat_probes,

    )).parsed
