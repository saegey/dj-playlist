from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.get_api_tracks_id_embedding_preview_response_200_type_0 import GetApiTracksIdEmbeddingPreviewResponse200Type0
from ...models.get_api_tracks_id_embedding_preview_response_200_type_1 import GetApiTracksIdEmbeddingPreviewResponse200Type1
from ...models.get_api_tracks_id_embedding_preview_response_200_type_2 import GetApiTracksIdEmbeddingPreviewResponse200Type2
from ...models.get_api_tracks_id_embedding_preview_response_400 import GetApiTracksIdEmbeddingPreviewResponse400
from ...models.get_api_tracks_id_embedding_preview_response_404 import GetApiTracksIdEmbeddingPreviewResponse404
from ...models.get_api_tracks_id_embedding_preview_type import GetApiTracksIdEmbeddingPreviewType
from ...types import UNSET, Unset
from typing import cast



def _get_kwargs(
    id: str,
    *,
    friend_id: int,
    type_: GetApiTracksIdEmbeddingPreviewType | Unset = GetApiTracksIdEmbeddingPreviewType.PROMPT,

) -> dict[str, Any]:
    

    

    params: dict[str, Any] = {}

    params["friend_id"] = friend_id

    json_type_: str | Unset = UNSET
    if not isinstance(type_, Unset):
        json_type_ = type_.value

    params["type"] = json_type_


    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}


    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/tracks/{id}/embedding-preview".format(id=quote(str(id), safe=""),),
        "params": params,
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> GetApiTracksIdEmbeddingPreviewResponse200Type0 | GetApiTracksIdEmbeddingPreviewResponse200Type1 | GetApiTracksIdEmbeddingPreviewResponse200Type2 | GetApiTracksIdEmbeddingPreviewResponse400 | GetApiTracksIdEmbeddingPreviewResponse404 | None:
    if response.status_code == 200:
        def _parse_response_200(data: object) -> GetApiTracksIdEmbeddingPreviewResponse200Type0 | GetApiTracksIdEmbeddingPreviewResponse200Type1 | GetApiTracksIdEmbeddingPreviewResponse200Type2:
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                response_200_type_0 = GetApiTracksIdEmbeddingPreviewResponse200Type0.from_dict(data)



                return response_200_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                response_200_type_1 = GetApiTracksIdEmbeddingPreviewResponse200Type1.from_dict(data)



                return response_200_type_1
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            if not isinstance(data, dict):
                raise TypeError()
            response_200_type_2 = GetApiTracksIdEmbeddingPreviewResponse200Type2.from_dict(data)



            return response_200_type_2

        response_200 = _parse_response_200(response.json())

        return response_200

    if response.status_code == 400:
        response_400 = GetApiTracksIdEmbeddingPreviewResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 404:
        response_404 = GetApiTracksIdEmbeddingPreviewResponse404.from_dict(response.json())



        return response_404

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[GetApiTracksIdEmbeddingPreviewResponse200Type0 | GetApiTracksIdEmbeddingPreviewResponse200Type1 | GetApiTracksIdEmbeddingPreviewResponse200Type2 | GetApiTracksIdEmbeddingPreviewResponse400 | GetApiTracksIdEmbeddingPreviewResponse404]:
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
    type_: GetApiTracksIdEmbeddingPreviewType | Unset = GetApiTracksIdEmbeddingPreviewType.PROMPT,

) -> Response[GetApiTracksIdEmbeddingPreviewResponse200Type0 | GetApiTracksIdEmbeddingPreviewResponse200Type1 | GetApiTracksIdEmbeddingPreviewResponse200Type2 | GetApiTracksIdEmbeddingPreviewResponse400 | GetApiTracksIdEmbeddingPreviewResponse404]:
    """ Preview track embedding data

    Args:
        id (str):
        friend_id (int):
        type_ (GetApiTracksIdEmbeddingPreviewType | Unset):  Default:
            GetApiTracksIdEmbeddingPreviewType.PROMPT.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[GetApiTracksIdEmbeddingPreviewResponse200Type0 | GetApiTracksIdEmbeddingPreviewResponse200Type1 | GetApiTracksIdEmbeddingPreviewResponse200Type2 | GetApiTracksIdEmbeddingPreviewResponse400 | GetApiTracksIdEmbeddingPreviewResponse404]
     """


    kwargs = _get_kwargs(
        id=id,
friend_id=friend_id,
type_=type_,

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
    type_: GetApiTracksIdEmbeddingPreviewType | Unset = GetApiTracksIdEmbeddingPreviewType.PROMPT,

) -> GetApiTracksIdEmbeddingPreviewResponse200Type0 | GetApiTracksIdEmbeddingPreviewResponse200Type1 | GetApiTracksIdEmbeddingPreviewResponse200Type2 | GetApiTracksIdEmbeddingPreviewResponse400 | GetApiTracksIdEmbeddingPreviewResponse404 | None:
    """ Preview track embedding data

    Args:
        id (str):
        friend_id (int):
        type_ (GetApiTracksIdEmbeddingPreviewType | Unset):  Default:
            GetApiTracksIdEmbeddingPreviewType.PROMPT.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        GetApiTracksIdEmbeddingPreviewResponse200Type0 | GetApiTracksIdEmbeddingPreviewResponse200Type1 | GetApiTracksIdEmbeddingPreviewResponse200Type2 | GetApiTracksIdEmbeddingPreviewResponse400 | GetApiTracksIdEmbeddingPreviewResponse404
     """


    return sync_detailed(
        id=id,
client=client,
friend_id=friend_id,
type_=type_,

    ).parsed

async def asyncio_detailed(
    id: str,
    *,
    client: AuthenticatedClient | Client,
    friend_id: int,
    type_: GetApiTracksIdEmbeddingPreviewType | Unset = GetApiTracksIdEmbeddingPreviewType.PROMPT,

) -> Response[GetApiTracksIdEmbeddingPreviewResponse200Type0 | GetApiTracksIdEmbeddingPreviewResponse200Type1 | GetApiTracksIdEmbeddingPreviewResponse200Type2 | GetApiTracksIdEmbeddingPreviewResponse400 | GetApiTracksIdEmbeddingPreviewResponse404]:
    """ Preview track embedding data

    Args:
        id (str):
        friend_id (int):
        type_ (GetApiTracksIdEmbeddingPreviewType | Unset):  Default:
            GetApiTracksIdEmbeddingPreviewType.PROMPT.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[GetApiTracksIdEmbeddingPreviewResponse200Type0 | GetApiTracksIdEmbeddingPreviewResponse200Type1 | GetApiTracksIdEmbeddingPreviewResponse200Type2 | GetApiTracksIdEmbeddingPreviewResponse400 | GetApiTracksIdEmbeddingPreviewResponse404]
     """


    kwargs = _get_kwargs(
        id=id,
friend_id=friend_id,
type_=type_,

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
    type_: GetApiTracksIdEmbeddingPreviewType | Unset = GetApiTracksIdEmbeddingPreviewType.PROMPT,

) -> GetApiTracksIdEmbeddingPreviewResponse200Type0 | GetApiTracksIdEmbeddingPreviewResponse200Type1 | GetApiTracksIdEmbeddingPreviewResponse200Type2 | GetApiTracksIdEmbeddingPreviewResponse400 | GetApiTracksIdEmbeddingPreviewResponse404 | None:
    """ Preview track embedding data

    Args:
        id (str):
        friend_id (int):
        type_ (GetApiTracksIdEmbeddingPreviewType | Unset):  Default:
            GetApiTracksIdEmbeddingPreviewType.PROMPT.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        GetApiTracksIdEmbeddingPreviewResponse200Type0 | GetApiTracksIdEmbeddingPreviewResponse200Type1 | GetApiTracksIdEmbeddingPreviewResponse200Type2 | GetApiTracksIdEmbeddingPreviewResponse400 | GetApiTracksIdEmbeddingPreviewResponse404
     """


    return (await asyncio_detailed(
        id=id,
client=client,
friend_id=friend_id,
type_=type_,

    )).parsed
