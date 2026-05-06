import Foundation

struct Playlist: Decodable, Identifiable, Hashable {
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
    let releaseID: String?
    let position: String?
    let title: String?
    let artist: String?
    let albumName: String?
    let physicalIdentifier: String?
    let duration: String?
    let albumThumbnailURL: String?
    let localAudioURL: String?
    let bpm: Double?
    let embedding: String?
    let durationSeconds: Double?

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
    var displayPosition: String? { position?.nonEmpty }
    var displayAlbumName: String { albumName?.nonEmpty ?? "Unknown album" }
    var displayPhysicalIdentifier: String? { physicalIdentifier?.nonEmpty }
    var displayDuration: String? {
        if let duration = duration?.nonEmpty {
            return duration
        }
        if let seconds = durationSeconds, seconds > 0 {
            let mins = Int(seconds) / 60
            let secs = Int(seconds) % 60
            return String(format: "%d:%02d", mins, secs)
        }
        return nil
    }
    var albumArtURL: URL? {
        guard let albumThumbnailURL = albumThumbnailURL?.nonEmpty else { return nil }
        return URL(string: albumThumbnailURL)
    }

    enum CodingKeys: String, CodingKey {
        case trackID = "track_id"
        case friendID = "friend_id"
        case releaseID = "release_id"
        case position
        case title
        case artist
        case artistName = "artist_name"
        case artists
        case creator
        case author
        case albumName = "album_name"
        case album
        case physicalIdentifier = "physical_identifier"
        case physicalIdentifierAlt = "physicalIdentifier"
        case libraryIdentifier = "library_identifier"
        case duration
        case albumThumbnailURL = "album_thumbnail"
        case localAudioURL = "local_audio_url"
        case bpm
        case embedding
        case durationSeconds = "duration_seconds"
    }

    init(
        trackID: String,
        friendID: Int?,
        releaseID: String?,
        position: String?,
        title: String?,
        artist: String?,
        albumName: String?,
        physicalIdentifier: String?,
        duration: String?,
        albumThumbnailURL: String?,
        localAudioURL: String?,
        bpm: Double?,
        embedding: String?,
        durationSeconds: Double? = nil
    ) {
        self.trackID = trackID
        self.friendID = friendID
        self.releaseID = releaseID
        self.position = position
        self.title = title
        self.artist = artist
        self.albumName = albumName
        self.physicalIdentifier = physicalIdentifier
        self.duration = duration
        self.albumThumbnailURL = albumThumbnailURL
        self.localAudioURL = localAudioURL
        self.bpm = bpm
        self.embedding = embedding
        self.durationSeconds = durationSeconds
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        trackID = try container.decode(String.self, forKey: .trackID)
        friendID = try container.decodeIfPresent(Int.self, forKey: .friendID)
        releaseID = Self.decodeOptionalString(forKey: .releaseID, from: container)
        position = Self.decodeOptionalString(forKey: .position, from: container)
        title = try container.decodeIfPresent(String.self, forKey: .title)
        if let albumNameValue = try container.decodeIfPresent(String.self, forKey: .albumName),
           !albumNameValue.isEmpty {
            albumName = albumNameValue
        } else {
            albumName = try container.decodeIfPresent(String.self, forKey: .album)
        }
        physicalIdentifier = Self.decodeOptionalString(forKey: .libraryIdentifier, from: container)
            ?? Self.decodeOptionalString(forKey: .physicalIdentifier, from: container)
            ?? Self.decodeOptionalString(forKey: .physicalIdentifierAlt, from: container)
        duration = try container.decodeIfPresent(String.self, forKey: .duration)
        albumThumbnailURL = try container.decodeIfPresent(String.self, forKey: .albumThumbnailURL)
        localAudioURL = try container.decodeIfPresent(String.self, forKey: .localAudioURL)
        bpm = Self.decodeOptionalDouble(forKey: .bpm, from: container)
        durationSeconds = Self.decodeOptionalDouble(forKey: .durationSeconds, from: container)
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

    private static func decodeOptionalString(
        forKey key: CodingKeys,
        from container: KeyedDecodingContainer<CodingKeys>
    ) -> String? {
        if let stringValue = try? container.decodeIfPresent(String.self, forKey: key),
           !stringValue.isEmpty {
            return stringValue
        }
        if let intValue = try? container.decodeIfPresent(Int.self, forKey: key) {
            return String(intValue)
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

struct Album: Decodable, Identifiable, Hashable {
    let rawID: String?
    let releaseID: String?
    let friendID: Int?
    let artist: String?
    let name: String?
    let physicalIdentifier: String?
    let coverURLString: String?
    let year: String?
    let label: String?
    let format: String?
    let genres: [String]?
    let styles: [String]?
    let trackCount: Int?

    var id: String {
        if let releaseID = releaseID?.nonEmpty, let friendID {
            return "\(releaseID):\(friendID)"
        }
        return physicalIdentifier?.nonEmpty
            ?? rawID?.nonEmpty
            ?? "\(displayArtist)-\(displayName)"
    }

    var displayArtist: String {
        artist?.nonEmpty ?? "Unknown artist"
    }

    var displayName: String {
        name?.nonEmpty ?? "Unknown album"
    }

    var displayPhysicalIdentifier: String {
        physicalIdentifier?.nonEmpty ?? "No physical identifier"
    }

    var coverArtURL: URL? {
        guard let coverURLString = coverURLString?.nonEmpty else { return nil }
        return URL(string: coverURLString)
    }

    enum CodingKeys: String, CodingKey {
        case rawID = "id"
        case releaseID = "release_id"
        case friendID = "friend_id"
        case artist
        case artistName = "artist_name"
        case artists
        case creator
        case author
        case name
        case title
        case album
        case albumName = "album_name"
        case physicalIdentifier = "physical_identifier"
        case physicalIdentifierAlt = "physicalIdentifier"
        case libraryIdentifier = "library_identifier"
        case coverURLString = "cover"
        case coverURL = "cover_url"
        case image
        case imageURL = "image_url"
        case albumThumbnail = "album_thumbnail"
        case audioFileAlbumArtUrl = "audio_file_album_art_url"
        case year
        case label
        case format
        case genres
        case styles
        case trackCount = "track_count"
    }

    init(
        rawID: String?,
        releaseID: String?,
        friendID: Int?,
        artist: String?,
        name: String?,
        physicalIdentifier: String?,
        coverURLString: String?,
        year: String?,
        label: String?,
        format: String?,
        genres: [String]?,
        styles: [String]?,
        trackCount: Int?
    ) {
        self.rawID = rawID
        self.releaseID = releaseID
        self.friendID = friendID
        self.artist = artist
        self.name = name
        self.physicalIdentifier = physicalIdentifier
        self.coverURLString = coverURLString
        self.year = year
        self.label = label
        self.format = format
        self.genres = genres
        self.styles = styles
        self.trackCount = trackCount
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        rawID = Self.decodeLossyString(forKey: .rawID, from: container)
        releaseID = Self.decodeLossyString(forKey: .releaseID, from: container)
        friendID = try container.decodeIfPresent(Int.self, forKey: .friendID)
        year = Self.decodeLossyString(forKey: .year, from: container)
        label = Self.decodeLossyString(forKey: .label, from: container)
        format = Self.decodeLossyString(forKey: .format, from: container)
        genres = try container.decodeIfPresent([String].self, forKey: .genres)
        styles = try container.decodeIfPresent([String].self, forKey: .styles)
        trackCount = try container.decodeIfPresent(Int.self, forKey: .trackCount)
        physicalIdentifier = Self.decodeLossyString(forKey: .libraryIdentifier, from: container)
            ?? Self.decodeLossyString(forKey: .physicalIdentifier, from: container)
            ?? Self.decodeLossyString(forKey: .physicalIdentifierAlt, from: container)
        coverURLString = Self.decodeLossyString(forKey: .audioFileAlbumArtUrl, from: container)
            ?? Self.decodeLossyString(forKey: .albumThumbnail, from: container)
            ?? Self.decodeLossyString(forKey: .coverURLString, from: container)
            ?? Self.decodeLossyString(forKey: .coverURL, from: container)
            ?? Self.decodeLossyString(forKey: .image, from: container)
            ?? Self.decodeLossyString(forKey: .imageURL, from: container)
        name = Self.decodeLossyString(forKey: .name, from: container)
            ?? Self.decodeLossyString(forKey: .title, from: container)
            ?? Self.decodeLossyString(forKey: .album, from: container)
            ?? Self.decodeLossyString(forKey: .albumName, from: container)

        if let value = Self.decodeLossyString(forKey: .artist, from: container), !value.isEmpty {
            artist = value
        } else if let value = Self.decodeLossyString(forKey: .artistName, from: container), !value.isEmpty {
            artist = value
        } else if let values = try container.decodeIfPresent([String].self, forKey: .artists), !values.isEmpty {
            artist = values.joined(separator: ", ")
        } else if let value = Self.decodeLossyString(forKey: .artists, from: container), !value.isEmpty {
            artist = value
        } else if let value = Self.decodeLossyString(forKey: .creator, from: container), !value.isEmpty {
            artist = value
        } else if let value = Self.decodeLossyString(forKey: .author, from: container), !value.isEmpty {
            artist = value
        } else {
            artist = nil
        }
    }

    private static func decodeLossyString(
        forKey key: CodingKeys,
        from container: KeyedDecodingContainer<CodingKeys>
    ) -> String? {
        if let stringValue = try? container.decodeIfPresent(String.self, forKey: key),
           !stringValue.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return stringValue
        }
        if let intValue = try? container.decodeIfPresent(Int.self, forKey: key) {
            return String(intValue)
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

struct CreatePlaylistRequest: Encodable {
    let name: String
    let tracks: [PlaylistTrackRef]
}

struct PlaylistTrackRef: Encodable {
    let track_id: String
    let friend_id: Int
}

struct PatchPlaylistRequest: Encodable {
    let id: Int
    let tracks: [PlaylistTrackRef]
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

struct TrackSearchResponse: Decodable {
    let hits: [Track]
}

struct AlbumSearchResponse: Decodable {
    let hits: [Album]
}

struct AlbumDetailResponse: Decodable {
    let album: Album
    let tracks: [Track]
}

struct Friend: Decodable, Identifiable, Hashable {
    let id: Int
    let username: String
}

struct FriendsResponse: Decodable {
    let results: [Friend]
}

struct APIErrorResponse: Decodable {
    let error: String
    let message: String?
}
