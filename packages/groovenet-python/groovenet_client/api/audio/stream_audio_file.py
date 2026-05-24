from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.stream_audio_file_response_400 import StreamAudioFileResponse400
from ...models.stream_audio_file_response_404 import StreamAudioFileResponse404
from ...models.stream_audio_file_response_416 import StreamAudioFileResponse416
from ...models.stream_audio_file_response_500 import StreamAudioFileResponse500
from ...types import UNSET, Unset
from typing import cast



def _get_kwargs(
    *,
    filename: str,
    range_: str | Unset = UNSET,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}
    if not isinstance(range_, Unset):
        headers["range"] = range_



    

    params: dict[str, Any] = {}

    params["filename"] = filename


    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}


    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/audio",
        "params": params,
    }


    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> StreamAudioFileResponse400 | StreamAudioFileResponse404 | StreamAudioFileResponse416 | StreamAudioFileResponse500 | None:
    if response.status_code == 400:
        response_400 = StreamAudioFileResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 404:
        response_404 = StreamAudioFileResponse404.from_dict(response.json())



        return response_404

    if response.status_code == 416:
        response_416 = StreamAudioFileResponse416.from_dict(response.json())



        return response_416

    if response.status_code == 500:
        response_500 = StreamAudioFileResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[StreamAudioFileResponse400 | StreamAudioFileResponse404 | StreamAudioFileResponse416 | StreamAudioFileResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    filename: str,
    range_: str | Unset = UNSET,

) -> Response[StreamAudioFileResponse400 | StreamAudioFileResponse404 | StreamAudioFileResponse416 | StreamAudioFileResponse500]:
    """ Stream local audio file for browser playback

    Args:
        filename (str):
        range_ (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[StreamAudioFileResponse400 | StreamAudioFileResponse404 | StreamAudioFileResponse416 | StreamAudioFileResponse500]
     """


    kwargs = _get_kwargs(
        filename=filename,
range_=range_,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    *,
    client: AuthenticatedClient | Client,
    filename: str,
    range_: str | Unset = UNSET,

) -> StreamAudioFileResponse400 | StreamAudioFileResponse404 | StreamAudioFileResponse416 | StreamAudioFileResponse500 | None:
    """ Stream local audio file for browser playback

    Args:
        filename (str):
        range_ (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        StreamAudioFileResponse400 | StreamAudioFileResponse404 | StreamAudioFileResponse416 | StreamAudioFileResponse500
     """


    return sync_detailed(
        client=client,
filename=filename,
range_=range_,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    filename: str,
    range_: str | Unset = UNSET,

) -> Response[StreamAudioFileResponse400 | StreamAudioFileResponse404 | StreamAudioFileResponse416 | StreamAudioFileResponse500]:
    """ Stream local audio file for browser playback

    Args:
        filename (str):
        range_ (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[StreamAudioFileResponse400 | StreamAudioFileResponse404 | StreamAudioFileResponse416 | StreamAudioFileResponse500]
     """


    kwargs = _get_kwargs(
        filename=filename,
range_=range_,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    *,
    client: AuthenticatedClient | Client,
    filename: str,
    range_: str | Unset = UNSET,

) -> StreamAudioFileResponse400 | StreamAudioFileResponse404 | StreamAudioFileResponse416 | StreamAudioFileResponse500 | None:
    """ Stream local audio file for browser playback

    Args:
        filename (str):
        range_ (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        StreamAudioFileResponse400 | StreamAudioFileResponse404 | StreamAudioFileResponse416 | StreamAudioFileResponse500
     """


    return (await asyncio_detailed(
        client=client,
filename=filename,
range_=range_,

    )).parsed
