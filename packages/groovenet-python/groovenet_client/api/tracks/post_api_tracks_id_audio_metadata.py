from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.post_api_tracks_id_audio_metadata_body import PostApiTracksIdAudioMetadataBody
from ...models.post_api_tracks_id_audio_metadata_response_200 import PostApiTracksIdAudioMetadataResponse200
from ...models.post_api_tracks_id_audio_metadata_response_400 import PostApiTracksIdAudioMetadataResponse400
from ...models.post_api_tracks_id_audio_metadata_response_404 import PostApiTracksIdAudioMetadataResponse404
from typing import cast



def _get_kwargs(
    id: str,
    *,
    body: PostApiTracksIdAudioMetadataBody,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/tracks/{id}/audio-metadata".format(id=quote(str(id), safe=""),),
    }

    _kwargs["json"] = body.to_dict()


    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> PostApiTracksIdAudioMetadataResponse200 | PostApiTracksIdAudioMetadataResponse400 | PostApiTracksIdAudioMetadataResponse404 | None:
    if response.status_code == 200:
        response_200 = PostApiTracksIdAudioMetadataResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = PostApiTracksIdAudioMetadataResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 404:
        response_404 = PostApiTracksIdAudioMetadataResponse404.from_dict(response.json())



        return response_404

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[PostApiTracksIdAudioMetadataResponse200 | PostApiTracksIdAudioMetadataResponse400 | PostApiTracksIdAudioMetadataResponse404]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    id: str,
    *,
    client: AuthenticatedClient | Client,
    body: PostApiTracksIdAudioMetadataBody,

) -> Response[PostApiTracksIdAudioMetadataResponse200 | PostApiTracksIdAudioMetadataResponse400 | PostApiTracksIdAudioMetadataResponse404]:
    """ Extract embedded audio cover art

    Args:
        id (str):
        body (PostApiTracksIdAudioMetadataBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[PostApiTracksIdAudioMetadataResponse200 | PostApiTracksIdAudioMetadataResponse400 | PostApiTracksIdAudioMetadataResponse404]
     """


    kwargs = _get_kwargs(
        id=id,
body=body,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    id: str,
    *,
    client: AuthenticatedClient | Client,
    body: PostApiTracksIdAudioMetadataBody,

) -> PostApiTracksIdAudioMetadataResponse200 | PostApiTracksIdAudioMetadataResponse400 | PostApiTracksIdAudioMetadataResponse404 | None:
    """ Extract embedded audio cover art

    Args:
        id (str):
        body (PostApiTracksIdAudioMetadataBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        PostApiTracksIdAudioMetadataResponse200 | PostApiTracksIdAudioMetadataResponse400 | PostApiTracksIdAudioMetadataResponse404
     """


    return sync_detailed(
        id=id,
client=client,
body=body,

    ).parsed

async def asyncio_detailed(
    id: str,
    *,
    client: AuthenticatedClient | Client,
    body: PostApiTracksIdAudioMetadataBody,

) -> Response[PostApiTracksIdAudioMetadataResponse200 | PostApiTracksIdAudioMetadataResponse400 | PostApiTracksIdAudioMetadataResponse404]:
    """ Extract embedded audio cover art

    Args:
        id (str):
        body (PostApiTracksIdAudioMetadataBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[PostApiTracksIdAudioMetadataResponse200 | PostApiTracksIdAudioMetadataResponse400 | PostApiTracksIdAudioMetadataResponse404]
     """


    kwargs = _get_kwargs(
        id=id,
body=body,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    id: str,
    *,
    client: AuthenticatedClient | Client,
    body: PostApiTracksIdAudioMetadataBody,

) -> PostApiTracksIdAudioMetadataResponse200 | PostApiTracksIdAudioMetadataResponse400 | PostApiTracksIdAudioMetadataResponse404 | None:
    """ Extract embedded audio cover art

    Args:
        id (str):
        body (PostApiTracksIdAudioMetadataBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        PostApiTracksIdAudioMetadataResponse200 | PostApiTracksIdAudioMetadataResponse400 | PostApiTracksIdAudioMetadataResponse404
     """


    return (await asyncio_detailed(
        id=id,
client=client,
body=body,

    )).parsed
