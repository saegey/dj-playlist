import Foundation

struct PlaylistService {
    let client: APIClient

    func fetchAlbums(query: String = "", friendID: Int? = nil) async throws -> [Album] {
        let trimmedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)
        let encodedQuery = trimmedQuery.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        var path = "/api/albums?limit=100"
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

    func fetchFriends() async throws -> [Friend] {
        let response: FriendsResponse = try await client.request(path: "/api/friends", method: "GET")
        return response.results
    }

    func fetchAlbumDetail(releaseID: String, friendID: Int) async throws -> AlbumDetailResponse {
        let encodedReleaseID = releaseID.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? releaseID
        let path = "/api/albums/\(encodedReleaseID)?friend_id=\(friendID)"
        return try await client.request(path: path, method: "GET")
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

    func testConnection() async throws {
        _ = try await client.rawRequest(path: "/api/albums?limit=1")
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
                position: reference.position ?? match.position,
                title: match.title ?? reference.title,
                artist: match.artist ?? reference.artist,
                duration: match.duration ?? reference.duration,
                albumThumbnailURL: match.albumThumbnailURL ?? reference.albumThumbnailURL,
                localAudioURL: match.localAudioURL ?? reference.localAudioURL,
                bpm: match.bpm ?? reference.bpm,
                embedding: match.embedding ?? reference.embedding
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
