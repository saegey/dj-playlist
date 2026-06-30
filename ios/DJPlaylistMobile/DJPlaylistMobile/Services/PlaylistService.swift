import Foundation

struct PlaylistService {
    let client: APIClient

    func fetchAlbums(query: String = "", friendID: Int? = nil, limit: Int = 50, offset: Int = 0) async throws -> [Album] {
        let trimmedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)
        let encodedQuery = trimmedQuery.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        var path = "/api/albums?limit=\(limit)&offset=\(offset)"
        if !encodedQuery.isEmpty {
            path += "&q=\(encodedQuery)"
        }
        if let friendID {
            path += "&friend_id=\(friendID)"
        }
        let data = try await client.rawRequest(path: path)
        let response = try JSONDecoder().decode(AlbumSearchResponse.self, from: data)
        return response.hits
    }

    func searchTracks(query: String = "", friendID: Int? = nil) async throws -> [Track] {
        let trimmedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)
        let encodedQuery = trimmedQuery.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        var path = "/api/tracks/search?limit=100"
        if !encodedQuery.isEmpty {
            path += "&q=\(encodedQuery)"
        }
        if let friendID {
            path += "&filter=friend_id%20%3D%20\(friendID)"
        }
        let data = try await client.rawRequest(path: path)
        let response = try JSONDecoder().decode(TrackSearchResponse.self, from: data)
        return response.hits
    }

    func fetchFriends() async throws -> [Friend] {
        let response: FriendsResponse = try await client.request(path: "/api/friends", method: "GET")
        return response.results
    }

    func fetchAlbumDetail(releaseID: String, friendID: Int) async throws -> AlbumDetailResponse {
        let encodedReleaseID = releaseID.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? releaseID
        let path = "/api/albums/\(encodedReleaseID)?friend_id=\(friendID)"
        return try await client.request(path: path, method: "GET")
    }

    func fetchAlbumPlayableStructure(releaseID: String, friendID: Int) async throws -> AlbumPlayableStructureResponse {
        let encodedReleaseID = releaseID.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? releaseID
        let path = "/api/albums/\(encodedReleaseID)/playable-structure?friend_id=\(friendID)"
        return try await client.request(path: path, method: "GET")
    }

    func createSpin(request: SpinCreateRequest) async throws -> SpinCreateResponse {
        let body = try JSONEncoder().encode(request)
        let data = try await client.rawRequest(path: "/api/spins", method: "POST", body: body)
        if data.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return SpinCreateResponse(spin: nil)
        }
        return (try? JSONDecoder().decode(SpinCreateResponse.self, from: data)) ?? SpinCreateResponse(spin: nil)
    }

    func fetchSpins(friendID: Int, releaseID: String, limit: Int = 20, offset: Int = 0) async throws -> [SpinListItem] {
        let encodedReleaseID = releaseID.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? releaseID
        let path = "/api/spins?friend_id=\(friendID)&release_id=\(encodedReleaseID)&limit=\(limit)&offset=\(offset)"
        let data = try await client.rawRequest(path: path)

        do {
            return try JSONDecoder().decode(SpinListResponse.self, from: data).items
        } catch let error as DecodingError {
            throw APIError.decodingError(message(for: error))
        } catch {
            throw APIError.decodingError(error.localizedDescription)
        }
    }

    func deleteSpin(id: Int, friendID: Int) async throws {
        _ = try await client.rawRequest(path: "/api/spins/\(id)?friend_id=\(friendID)", method: "DELETE")
    }

    func updateAlbum(
        releaseID: String,
        friendID: Int,
        albumRating: Double,
        albumNotes: String,
        purchasePrice: Double,
        condition: String,
        libraryIdentifier: String
    ) async throws {
        let payload = UpdateAlbumRequest(
            release_id: releaseID,
            friend_id: friendID,
            album_rating: albumRating,
            album_notes: albumNotes,
            purchase_price: purchasePrice,
            condition: condition,
            library_identifier: libraryIdentifier
        )
        let body = try JSONEncoder().encode(payload)
        _ = try await client.rawRequest(path: "/api/albums/update", method: "PATCH", body: body)
    }

    func fetchPlaylists() async throws -> [Playlist] {
        let data = try await client.rawRequest(path: "/api/playlists")

        do {
            return try JSONDecoder().decode([Playlist].self, from: data)
        } catch {
            let response = try decodePlaylistsResponse(from: data)
            return response.playlists
        }
    }

    func fetchTrackDetail(trackID: String, friendID: Int) async throws -> Track {
        let encodedTrackID = trackID.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? trackID
        let path = "/api/tracks/\(encodedTrackID)?friend_id=\(friendID)"
        return try await client.request(path: path, method: "GET")
    }

    func fetchPlaylists(forTrackID trackID: String, friendID: Int) async throws -> [Playlist] {
        let encodedTrackID = trackID.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? trackID
        let data = try await client.rawRequest(path: "/api/tracks/\(encodedTrackID)/playlists?friend_id=\(friendID)")

        do {
            return try JSONDecoder().decode([Playlist].self, from: data)
        } catch {
            let response = try decodePlaylistsResponse(from: data)
            return response.playlists
        }
    }

    func fetchTracks(for playlistID: Int) async throws -> [Track] {
        let data = try await client.rawRequest(path: "/api/playlists/\(playlistID)/tracks")
        let references: [Track]

        do {
            references = try JSONDecoder().decode([Track].self, from: data)
        } catch {
            let response = try decodeTracksResponse(from: data)
            references = response.tracks
        }

        return await enrichTrackReferences(references)
    }

    func generateGeneticPlaylist(from tracks: [Track]) async throws -> [Track] {
        let payload = GeneticRequest(playlist: tracks.map(TrackPayload.init(track:)))
        let body = try JSONEncoder().encode(payload)
        let response: GeneticResponse = try await client.request(
            path: "/api/playlists/genetic",
            method: "POST",
            body: body
        )

        return response.optimizedPlaylist ?? response.playlist ?? []
    }

    func fetchPlaylistRecommendations(tracks: [Track], limitIdentity: Int = 50, limitAudio: Int = 50) async throws -> [Track] {
        let refs = tracks.compactMap { track -> PlaylistTrackRef? in
            guard let friendID = track.friendID else { return nil }
            return PlaylistTrackRef(track_id: track.trackID, friend_id: friendID)
        }
        guard !refs.isEmpty else { return [] }

        let candidateBody = try JSONEncoder().encode(RecommendationsBatchRequest(tracks: refs, limit_identity: limitIdentity, limit_audio: limitAudio))
        let candidateData = try await client.rawRequest(path: "/api/recommendations/candidates", method: "POST", body: candidateBody)
        let candidatesResponse = try JSONDecoder().decode(RecommendationsResponse.self, from: candidateData)
        guard !candidatesResponse.candidates.isEmpty else { return [] }

        let batchRefs = candidatesResponse.candidates.map { PlaylistTrackRef(track_id: $0.trackId, friend_id: $0.friendId) }
        let batchBody = try JSONEncoder().encode(TrackBatchRequest(tracks: batchRefs))
        let tracksData = try await client.rawRequest(path: "/api/tracks/batch", method: "POST", body: batchBody)
        return try JSONDecoder().decode([Track].self, from: tracksData)
    }

    func fetchSimilarTracksEnriched(trackID: String, friendID: Int, limit: Int = 20) async throws -> [Track] {
        let encodedTrackID = trackID.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? trackID
        let path = "/api/recommendations/candidates?track_id=\(encodedTrackID)&friend_id=\(friendID)&limit_identity=\(limit)&limit_audio=\(limit)"
        let data = try await client.rawRequest(path: path)
        let response = try JSONDecoder().decode(RecommendationsResponse.self, from: data)
        guard !response.candidates.isEmpty else { return [] }
        let batchRefs = response.candidates.map { PlaylistTrackRef(track_id: $0.trackId, friend_id: $0.friendId) }
        let batchBody = try JSONEncoder().encode(TrackBatchRequest(tracks: batchRefs))
        let tracksData = try await client.rawRequest(path: "/api/tracks/batch", method: "POST", body: batchBody)
        return try JSONDecoder().decode([Track].self, from: tracksData)
    }

    func fetchSimilarTracks(trackID: String, friendID: Int, limit: Int = 50) async throws -> [Track] {
        let encodedTrackID = trackID.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? trackID
        let path = "/api/recommendations/candidates?track_id=\(encodedTrackID)&friend_id=\(friendID)&limit_identity=\(limit)&limit_audio=\(limit)"
        let data = try await client.rawRequest(path: path)
        let response = try JSONDecoder().decode(RecommendationsResponse.self, from: data)
        return response.candidates.map { candidate in
            Track(
                trackID: candidate.trackId,
                friendID: candidate.friendId,
                releaseID: nil,
                position: nil,
                title: candidate.metadata.title,
                artist: candidate.metadata.artist,
                albumName: candidate.metadata.album,
                physicalIdentifier: nil,
                duration: nil,
                albumThumbnailURL: candidate.metadata.albumThumbnail,
                audioFileAlbumArtURL: nil,
                localAudioURL: nil,
                bpm: candidate.metadata.bpm,
                embedding: nil,
                durationSeconds: nil,
                appleMusicURL: nil,
                discogsURL: nil,
                youtubeURL: nil
            )
        }
    }

    func addTrackToPlaylist(playlistID: Int, trackID: String, friendID: Int) async throws {
        let existingTracks = try await fetchTracks(for: playlistID)
        var refs = playlistTrackRefs(from: existingTracks)
        refs.append(PlaylistTrackRef(track_id: trackID, friend_id: friendID))
        try await patchPlaylist(playlistID: playlistID, tracks: refs)
    }

    func updatePlaylistTracks(playlistID: Int, tracks: [Track]) async throws {
        try await patchPlaylist(playlistID: playlistID, tracks: playlistTrackRefs(from: tracks))
    }

    func createPlaylist(name: String) async throws -> Playlist {
        let payload = CreatePlaylistRequest(name: name, tracks: [])
        let body = try JSONEncoder().encode(payload)
        return try await client.request(path: "/api/playlists", method: "POST", body: body)
    }

    func deletePlaylist(id: Int) async throws {
        _ = try await client.rawRequest(path: "/api/playlists?id=\(id)", method: "DELETE")
    }

    func testConnection() async throws {
        _ = try await client.rawRequest(path: "/api/albums?limit=1")
    }

    private func patchPlaylist(playlistID: Int, tracks: [PlaylistTrackRef]) async throws {
        let payload = PatchPlaylistRequest(id: playlistID, tracks: tracks)
        let body = try JSONEncoder().encode(payload)
        _ = try await client.rawRequest(path: "/api/playlists", method: "PATCH", body: body)
    }

    private func playlistTrackRefs(from tracks: [Track]) -> [PlaylistTrackRef] {
        tracks.compactMap { track in
            guard let friendID = track.friendID else { return nil }
            return PlaylistTrackRef(track_id: track.trackID, friend_id: friendID)
        }
    }

    private func decodePlaylistsResponse(from data: Data) throws -> PlaylistsResponse {
        do {
            return try JSONDecoder().decode(PlaylistsResponse.self, from: data)
        } catch let error as DecodingError {
            throw APIError.decodingError(message(for: error))
        } catch {
            throw APIError.decodingError(error.localizedDescription)
        }
    }

    private func decodeTracksResponse(from data: Data) throws -> TracksResponse {
        do {
            return try JSONDecoder().decode(TracksResponse.self, from: data)
        } catch let error as DecodingError {
            throw APIError.decodingError(message(for: error))
        } catch {
            throw APIError.decodingError(error.localizedDescription)
        }
    }

    private func enrichTrackReferences(_ references: [Track]) async -> [Track] {
        await withTaskGroup(of: (Int, Track).self) { group in
            for (index, reference) in references.enumerated() {
                group.addTask {
                    let enriched = await enrichTrackReference(reference)
                    return (index, enriched)
                }
            }

            var results = Array(references.enumerated().map { ($0.offset, $0.element) })
            for await (index, track) in group {
                results[index] = (index, track)
            }

            return results
                .sorted { $0.0 < $1.0 }
                .map(\.1)
        }
    }

    private func enrichTrackReference(_ reference: Track) async -> Track {
        guard let friendID = reference.friendID else {
            return reference
        }

        do {
            let encodedTrackID = reference.trackID.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? reference.trackID
            let path = "/api/tracks/\(encodedTrackID)?friend_id=\(friendID)"
            let match: Track = try await client.request(path: path, method: "GET")

            return Track(
                trackID: match.trackID,
                friendID: reference.friendID ?? match.friendID,
                releaseID: reference.releaseID ?? match.releaseID,
                position: match.position ?? reference.position,
                title: match.title ?? reference.title,
                artist: match.artist ?? reference.artist,
                albumName: match.albumName ?? reference.albumName,
                physicalIdentifier: match.physicalIdentifier ?? reference.physicalIdentifier,
                duration: match.duration ?? reference.duration,
                albumThumbnailURL: match.albumThumbnailURL ?? reference.albumThumbnailURL,
                audioFileAlbumArtURL: match.audioFileAlbumArtURL ?? reference.audioFileAlbumArtURL,
                localAudioURL: match.localAudioURL ?? reference.localAudioURL,
                bpm: match.bpm ?? reference.bpm,
                embedding: match.embedding ?? reference.embedding,
                durationSeconds: match.durationSeconds ?? reference.durationSeconds,
                appleMusicURL: match.appleMusicURL ?? reference.appleMusicURL,
                discogsURL: match.discogsURL ?? reference.discogsURL,
                youtubeURL: match.youtubeURL ?? reference.youtubeURL
            )
        } catch {
            return reference
        }
    }

    private func message(for error: DecodingError) -> String {
        switch error {
        case let .keyNotFound(key, context):
            return "Missing field '\(key.stringValue)' in server response at \(codingPathDescription(context.codingPath))."
        case let .typeMismatch(type, context):
            return "Expected \(type) at \(codingPathDescription(context.codingPath)), but the server returned a different shape."
        case let .valueNotFound(type, context):
            return "Missing \(type) value at \(codingPathDescription(context.codingPath))."
        case let .dataCorrupted(context):
            return "Invalid server data at \(codingPathDescription(context.codingPath)): \(context.debugDescription)"
        @unknown default:
            return "Could not decode server response."
        }
    }

    private func codingPathDescription(_ codingPath: [CodingKey]) -> String {
        guard !codingPath.isEmpty else { return "the top level" }
        return codingPath.map(\.stringValue).joined(separator: ".")
    }
}

private extension Data {
    func trimmingCharacters(in characterSet: CharacterSet) -> String {
        String(decoding: self, as: UTF8.self).trimmingCharacters(in: characterSet)
    }
}
