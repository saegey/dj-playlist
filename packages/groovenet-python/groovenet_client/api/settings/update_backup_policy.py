from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.update_backup_policy_body import UpdateBackupPolicyBody
from ...models.update_backup_policy_response_200 import UpdateBackupPolicyResponse200
from ...models.update_backup_policy_response_400 import UpdateBackupPolicyResponse400
from ...models.update_backup_policy_response_500 import UpdateBackupPolicyResponse500
from typing import cast



def _get_kwargs(
    *,
    body: UpdateBackupPolicyBody,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "put",
        "url": "/api/settings/backup",
    }

    _kwargs["json"] = body.to_dict()


    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> UpdateBackupPolicyResponse200 | UpdateBackupPolicyResponse400 | UpdateBackupPolicyResponse500 | None:
    if response.status_code == 200:
        response_200 = UpdateBackupPolicyResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = UpdateBackupPolicyResponse400.from_dict(response.json())



        return response_400

    if response.status_code == 500:
        response_500 = UpdateBackupPolicyResponse500.from_dict(response.json())



        return response_500

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[UpdateBackupPolicyResponse200 | UpdateBackupPolicyResponse400 | UpdateBackupPolicyResponse500]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: UpdateBackupPolicyBody,

) -> Response[UpdateBackupPolicyResponse200 | UpdateBackupPolicyResponse400 | UpdateBackupPolicyResponse500]:
    """ Update backup policy settings

    Args:
        body (UpdateBackupPolicyBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[UpdateBackupPolicyResponse200 | UpdateBackupPolicyResponse400 | UpdateBackupPolicyResponse500]
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
    body: UpdateBackupPolicyBody,

) -> UpdateBackupPolicyResponse200 | UpdateBackupPolicyResponse400 | UpdateBackupPolicyResponse500 | None:
    """ Update backup policy settings

    Args:
        body (UpdateBackupPolicyBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        UpdateBackupPolicyResponse200 | UpdateBackupPolicyResponse400 | UpdateBackupPolicyResponse500
     """


    return sync_detailed(
        client=client,
body=body,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: UpdateBackupPolicyBody,

) -> Response[UpdateBackupPolicyResponse200 | UpdateBackupPolicyResponse400 | UpdateBackupPolicyResponse500]:
    """ Update backup policy settings

    Args:
        body (UpdateBackupPolicyBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[UpdateBackupPolicyResponse200 | UpdateBackupPolicyResponse400 | UpdateBackupPolicyResponse500]
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
    body: UpdateBackupPolicyBody,

) -> UpdateBackupPolicyResponse200 | UpdateBackupPolicyResponse400 | UpdateBackupPolicyResponse500 | None:
    """ Update backup policy settings

    Args:
        body (UpdateBackupPolicyBody):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        UpdateBackupPolicyResponse200 | UpdateBackupPolicyResponse400 | UpdateBackupPolicyResponse500
     """


    return (await asyncio_detailed(
        client=client,
body=body,

    )).parsed
