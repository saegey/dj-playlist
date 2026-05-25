from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.get_api_tracks_id_audio_metadata_response_200 import GetApiTracksIdAudioMetadataResponse200
from ...models.get_api_tracks_id_audio_metadata_response_400 import GetApiTracksIdAudioMetadataResponse400
from ...models.get_api_tracks_id_audio_metadata_response_404 import GetApiTracksIdAudioMetadataResponse404
from typing import cast



def _get_kwargs(
    id: str,
    *,
    friend_id: int,

) -> dict[str, Any]:
    

    

    params: dict[str, Any] = {}

    params["friend_id"] = friend_id


    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}


    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/tracks/{id}/audio-metadata".format(id=quote(str(id), safe=""),),
        "params": params,
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> GetApiTracksIdAudioMetadataResponse200 | GetApiTracksIdAudioMetadataResponse400 | GetApiTracksIdAudioMetadataResponse404 | None:
    if response.status_code == 200:
        response_200 = GetApiTracksIdAudioMetadataResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = GetApiTracksIdAudioMetadataResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 404:
        response_404 = GetApiTracksIdAudioMetadataResponse404.from_dict(response.json())



        return response_404

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[GetApiTracksIdAudioMetadataResponse200 | GetApiTracksIdAudioMetadataResponse400 | GetApiTracksIdAudioMetadataResponse404]:
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
    friend_id: int,

) -> Response[GetApiTracksIdAudioMetadataResponse200 | GetApiTracksIdAudioMetadataResponse400 | GetApiTracksIdAudioMetadataResponse404]:
    """ Get local audio metadata for track

    Args:
        id (str):
        friend_id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[GetApiTracksIdAudioMetadataResponse200 | GetApiTracksIdAudioMetadataResponse400 | GetApiTracksIdAudioMetadataResponse404]
     """


    kwargs = _get_kwargs(
        id=id,
friend_id=friend_id,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    id: str,
    *,
    client: AuthenticatedClient | Client,
    friend_id: int,

) -> GetApiTracksIdAudioMetadataResponse200 | GetApiTracksIdAudioMetadataResponse400 | GetApiTracksIdAudioMetadataResponse404 | None:
    """ Get local audio metadata for track

    Args:
        id (str):
        friend_id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        GetApiTracksIdAudioMetadataResponse200 | GetApiTracksIdAudioMetadataResponse400 | GetApiTracksIdAudioMetadataResponse404
     """


    return sync_detailed(
        id=id,
client=client,
friend_id=friend_id,

    ).parsed

async def asyncio_detailed(
    id: str,
    *,
    client: AuthenticatedClient | Client,
    friend_id: int,

) -> Response[GetApiTracksIdAudioMetadataResponse200 | GetApiTracksIdAudioMetadataResponse400 | GetApiTracksIdAudioMetadataResponse404]:
    """ Get local audio metadata for track

    Args:
        id (str):
        friend_id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[GetApiTracksIdAudioMetadataResponse200 | GetApiTracksIdAudioMetadataResponse400 | GetApiTracksIdAudioMetadataResponse404]
     """


    kwargs = _get_kwargs(
        id=id,
friend_id=friend_id,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    id: str,
    *,
    client: AuthenticatedClient | Client,
    friend_id: int,

) -> GetApiTracksIdAudioMetadataResponse200 | GetApiTracksIdAudioMetadataResponse400 | GetApiTracksIdAudioMetadataResponse404 | None:
    """ Get local audio metadata for track

    Args:
        id (str):
        friend_id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        GetApiTracksIdAudioMetadataResponse200 | GetApiTracksIdAudioMetadataResponse400 | GetApiTracksIdAudioMetadataResponse404
     """


    return (await asyncio_detailed(
        id=id,
client=client,
friend_id=friend_id,

    )).parsed
