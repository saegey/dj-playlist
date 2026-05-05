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
    let friendID: Int?
    let position: Int?
    let title: String?
    let artist: String?
    let localAudioURL: String?
    let bpm: Double?
    let embedding: String?

    var id: String { trackID }
    var displayTitle: String { title?.nonEmpty ?? trackID }
    var displayArtist: String {
        if let artist = artist?.nonEmpty {
            return artist
        }
        if let friendID {
            return "Friend \(friendID)"
        }
        return "Track reference"
    }

    enum CodingKeys: String, CodingKey {
        case trackID = "track_id"
        case friendID = "friend_id"
        case position
        case title
        case artist
        case artistName = "artist_name"
        case artists
        case creator
        case author
        case localAudioURL = "local_audio_url"
        case bpm
        case embedding
    }

    init(
        trackID: String,
        friendID: Int?,
        position: Int?,
        title: String?,
        artist: String?,
        localAudioURL: String?,
        bpm: Double?,
        embedding: String?
    ) {
        self.trackID = trackID
        self.friendID = friendID
        self.position = position
        self.title = title
        self.artist = artist
        self.localAudioURL = localAudioURL
        self.bpm = bpm
        self.embedding = embedding
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        trackID = try container.decode(String.self, forKey: .trackID)
        friendID = try container.decodeIfPresent(Int.self, forKey: .friendID)
        position = Self.decodeOptionalInt(forKey: .position, from: container)
        title = try container.decodeIfPresent(String.self, forKey: .title)
        localAudioURL = try container.decodeIfPresent(String.self, forKey: .localAudioURL)
        bpm = Self.decodeOptionalDouble(forKey: .bpm, from: container)
        embedding = Self.decodeOptionalEmbedding(from: container)

        if let value = try container.decodeIfPresent(String.self, forKey: .artist), !value.isEmpty {
            artist = value
        } else if let value = try container.decodeIfPresent(String.self, forKey: .artistName), !value.isEmpty {
            artist = value
        } else if let values = try container.decodeIfPresent([String].self, forKey: .artists), !values.isEmpty {
            artist = values.joined(separator: ", ")
        } else if let value = try container.decodeIfPresent(String.self, forKey: .artists), !value.isEmpty {
            artist = value
        } else if let value = try container.decodeIfPresent(String.self, forKey: .creator), !value.isEmpty {
            artist = value
        } else if let value = try container.decodeIfPresent(String.self, forKey: .author), !value.isEmpty {
            artist = value
        } else {
            artist = nil
        }
    }

    private static func decodeOptionalInt(
        forKey key: CodingKeys,
        from container: KeyedDecodingContainer<CodingKeys>
    ) -> Int? {
        if let intValue = try? container.decodeIfPresent(Int.self, forKey: key) {
            return intValue
        }
        if let stringValue = try? container.decodeIfPresent(String.self, forKey: key) {
            return Int(stringValue.trimmingCharacters(in: .whitespacesAndNewlines))
        }
        return nil
    }

    private static func decodeOptionalDouble(
        forKey key: CodingKeys,
        from container: KeyedDecodingContainer<CodingKeys>
    ) -> Double? {
        if let doubleValue = try? container.decodeIfPresent(Double.self, forKey: key) {
            return doubleValue
        }
        if let intValue = try? container.decodeIfPresent(Int.self, forKey: key) {
            return Double(intValue)
        }
        if let stringValue = try? container.decodeIfPresent(String.self, forKey: key) {
            return Double(stringValue.trimmingCharacters(in: .whitespacesAndNewlines))
        }
        return nil
    }

    private static func decodeOptionalEmbedding(
        from container: KeyedDecodingContainer<CodingKeys>
    ) -> String? {
        if let stringValue = try? container.decodeIfPresent(String.self, forKey: .embedding) {
            return stringValue
        }
        if let values = try? container.decodeIfPresent([Double].self, forKey: .embedding) {
            return values.map { String($0) }.joined(separator: ",")
        }
        if let values = try? container.decodeIfPresent([Int].self, forKey: .embedding) {
            return values.map { String($0) }.joined(separator: ",")
        }
        return nil
    }
}

private extension String {
    var nonEmpty: String? {
        let trimmed = trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
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

struct PlaylistsResponse: Decodable {
    let playlists: [Playlist]
}

struct TracksResponse: Decodable {
    let tracks: [Track]
}

struct APIErrorResponse: Decodable {
    let error: String
    let message: String?
}
