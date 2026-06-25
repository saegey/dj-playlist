# DJPlaylistMobile — Vinyl Spin Logging Spec

## Status

- Owner: unassigned
- App target: `ios/DJPlaylistMobile/DJPlaylistMobile`
- Goal: add manual physical-vinyl spin logging to the iOS app
- Current backend status:
  - `GET /api/albums/{releaseId}/playable-structure` exists
  - `GET /api/spins` exists
  - `POST /api/spins` exists
  - `DELETE /api/spins/{id}` exists
  - `GET /api/spins/top-tracks` exists
  - mobile OpenAPI subset now includes the spin endpoints above
- Current mobile status:
  - no spin logging UI yet
  - no spin models in Swift yet
  - no spin service methods in Swift yet

## Problem Statement

The iOS app can browse albums and tracks, but it cannot yet log a physical vinyl spin from the phone. The backend now supports manual vinyl spin sessions, including side-based and track-based logging, so the mobile app should expose that flow from album detail.

This is manual physical-media logging only. It must stay separate from playback in the app.

## Scope

### In Scope

- Log a vinyl spin from album detail
- Fetch playable album structure for side grouping
- Support:
  - side-based spin logging
  - track-based spin logging
  - optional note
  - optional context type
  - editable played-at timestamp
- Show basic recent spin history for the current album

### Out of Scope

- Automatic logging from in-app playback
- Full global spin history tab
- Most-played analytics UI on iOS
- Playlist/gig logging UI

## Recommended UX

Primary entry point:

- `AlbumDetailView`

Recommended affordance:

- add `Log Spin` action to the existing `Menu` in the top-right toolbar
- optionally add a secondary inline button near the album header later, but not required for phase 1

Recommended presentation:

- present a sheet from `AlbumDetailView`
- use segmented control or picker for:
  - `Sides`
  - `Tracks`

Recommended form layout:

1. Played-at date/time control
2. Context text field
3. Note text editor
4. Selection mode toggle
5. Side list or track list
6. Save action

## API Endpoints to Use

### 1. Get playable structure

`GET /api/albums/{releaseId}/playable-structure?friend_id={friendID}`

Use this to:

- render normalized sides
- map tracks to sides
- drive side-based selection UI

### 2. Create spin

`POST /api/spins`

Two valid payload shapes:

Side-based:

```json
{
  "friend_id": 1,
  "release_id": "12345",
  "played_at": "2026-06-24T18:00:00.000Z",
  "context_type": "home",
  "note": "Played after dinner",
  "side_keys": ["A", "B"]
}
```

Track-based:

```json
{
  "friend_id": 1,
  "release_id": "12345",
  "played_at": "2026-06-24T18:00:00.000Z",
  "track_refs": [
    { "track_id": "trk-a1", "friend_id": 1 },
    { "track_id": "trk-b1", "friend_id": 1 }
  ]
}
```

### 3. List spins

`GET /api/spins?friend_id={friendID}&release_id={releaseID}&limit=20`

Use this for:

- recent album spin history in the sheet or album detail footer

### 4. Delete spin

`DELETE /api/spins/{id}?friend_id={friendID}`

Optional for the first mobile pass, but already supported.

## Swift Files to Touch

### Required

- `ios/DJPlaylistMobile/DJPlaylistMobile/Models/APIModels.swift`
- `ios/DJPlaylistMobile/DJPlaylistMobile/Services/PlaylistService.swift`
- `ios/DJPlaylistMobile/DJPlaylistMobile/Features/Generate/AlbumDetailView.swift`

### Optional

- add a dedicated view file for the logging sheet if you want cleaner separation
- if you add a new Swift file, make sure it is included in the Xcode project target

## Model Additions Needed in Swift

Add decodable/encodable models for:

- `AlbumPlayableStructureResponse`
- `AlbumPlayableStructureSide`
- `AlbumPlayableStructureTrack`
- `SpinSession`
- `SpinSelection`
- `TrackSpinEvent`
- `SpinDerived`
- `SpinListItem`
- `SpinListResponse`
- `SpinCreateRequest`
- `SpinCreateResponse`

Suggested encodable request shape:

- `friend_id`
- `release_id`
- `played_at`
- `note`
- `context_type`
- one of:
  - `side_keys`
  - `track_refs`

## Service Methods Needed

Add these to `PlaylistService`:

- `fetchAlbumPlayableStructure(releaseID:friendID:)`
- `createSpin(request:)`
- `fetchSpins(friendID:releaseID:limit:offset:)`
- optionally `deleteSpin(id:friendID:)`

Use the same `APIClient` pattern already used elsewhere.

## AlbumDetailView Changes

### New State

Add state for:

- `showLogSpinSheet`
- `playableStructure`
- `recentSpins`
- `isLoadingSpins`
- `spinError`

Within the sheet:

- `spinMode`
- `selectedSideKeys`
- `selectedTrackIDs`
- `spinPlayedAt`
- `spinContextType`
- `spinNote`
- `isSavingSpin`

### Trigger

Add to the existing toolbar `Menu`:

- `Button("Log Spin", systemImage: "opticaldisc")`

### Loading Strategy

Recommended:

- lazily fetch playable structure when the sheet opens
- fetch recent album spins either:
  - when album detail loads, or
  - when the sheet opens

### Save Behavior

On save:

1. validate at least one side or track is selected
2. build request payload
3. call `createSpin`
4. dismiss sheet on success
5. reload recent album spins
6. show lightweight success feedback

## Recommended First Pass UI

Keep the first mobile version simple:

- default mode: `Sides`
- default played-at: `Date()`
- support free-text context and note
- if mode is `Sides`, show each normalized side with:
  - side label
  - track count
  - checkbox style selection row
- if mode is `Tracks`, show track rows with:
  - position
  - title
  - artist if different from album artist

You do not need advanced batching, optimistic updates, or a dedicated analytics screen for the first pass.

## Acceptance Criteria

### Functional

- User can open an album in the iOS app
- User can open a `Log Spin` sheet
- User can log one or more sides
- User can log one or more tracks
- User can add note/context/played-at
- Successful save persists to backend
- Album-level recent spins can be loaded in mobile

### Non-Functional

- No coupling to audio playback state
- No need to regenerate or refactor the entire mobile app structure
- Errors are surfaced as user-readable messages

## Suggested Implementation Order

### Phase M1

- Add Swift API models
- Add `PlaylistService` methods
- Smoke test request/response decoding

### Phase M2

- Add `Log Spin` sheet to `AlbumDetailView`
- Implement side-based logging only

### Phase M3

- Add track-based logging mode
- Add recent album spin history

### Phase M4

- Add optional delete support for album spin history

## Notes for the Implementing Model

- This app already uses `PlaylistService` as the general API service. Reuse it rather than creating a parallel networking layer.
- Keep the mobile implementation aligned with the backend’s normalized side model instead of trying to infer sides locally in Swift.
- Treat spins as manual physical-media events, not player telemetry.
