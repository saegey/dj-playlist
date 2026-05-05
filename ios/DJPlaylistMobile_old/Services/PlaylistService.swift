import Foundation

struct PlaylistService {
    let client: APIClient

    func fetchPlaylists() async throws -> [Playlist] {
        try await client.request(path: "/api/playlists")
    }

    func fetchTracks(for playlistID: Int) async throws -> [Track] {
        try await client.request(path: "/api/playlists/\(playlistID)/tracks")
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
        _ = try await client.rawRequest(path: "/api/openapi.mobile.json")
    }
}
