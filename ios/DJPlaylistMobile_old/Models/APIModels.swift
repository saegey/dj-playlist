import Foundation

struct Playlist: Decodable, Identifiable {
    let id: Int
    let name: String
    let createdAt: String?
    let tracks: [Track]?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case createdAt = "created_at"
        case tracks
    }
}

struct Track: Decodable, Identifiable, Hashable {
    let trackID: String
    let title: String?
    let artist: String?
    let localAudioURL: String?
    let bpm: Double?
    let embedding: String?

    var id: String { trackID }

    enum CodingKeys: String, CodingKey {
        case trackID = "track_id"
        case title
        case artist
        case localAudioURL = "local_audio_url"
        case bpm
        case embedding
    }
}

struct GeneticRequest: Encodable {
    let playlist: [TrackPayload]
}

struct TrackPayload: Encodable {
    let track_id: String
    let title: String?
    let artist: String?
    let bpm: Double?
    let embedding: String?
    let local_audio_url: String?

    init(track: Track) {
        track_id = track.trackID
        title = track.title
        artist = track.artist
        bpm = track.bpm
        embedding = track.embedding
        local_audio_url = track.localAudioURL
    }
}

struct GeneticResponse: Decodable {
    let optimizedPlaylist: [Track]?
    let playlist: [Track]?

    enum CodingKeys: String, CodingKey {
        case optimizedPlaylist = "optimized_playlist"
        case playlist
    }
}

struct APIErrorResponse: Decodable {
    let error: String
    let message: String?
}
