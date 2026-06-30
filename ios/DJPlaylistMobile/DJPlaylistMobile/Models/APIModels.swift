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
    let audioFileAlbumArtURL: String?
    let localAudioURL: String?
    let bpm: Double?
    let embedding: String?
    let durationSeconds: Double?
    let appleMusicURL: String?
    let discogsURL: String?
    let youtubeURL: String?

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
        albumArtURL(relativeTo: nil)
    }

    func albumArtURL(relativeTo serverURL: URL?) -> URL? {
        let artworkURLString = audioFileAlbumArtURL?.nonEmpty ?? albumThumbnailURL?.nonEmpty
        guard let artworkURLString else { return nil }
        return Self.normalizedArtworkURL(from: artworkURLString, relativeTo: serverURL)
    }

    var isPlayable: Bool {
        localAudioURL?.nonEmpty != nil
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
        case audioFileAlbumArtURL = "audio_file_album_art_url"
        case localAudioURL = "local_audio_url"
        case bpm
        case embedding
        case durationSeconds = "duration_seconds"
        case appleMusicURL = "apple_music_url"
        case discogsURL = "discogs_url"
        case youtubeURL = "youtube_url"
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
        audioFileAlbumArtURL: String? = nil,
        localAudioURL: String?,
        bpm: Double?,
        embedding: String?,
        durationSeconds: Double? = nil,
        appleMusicURL: String? = nil,
        discogsURL: String? = nil,
        youtubeURL: String? = nil
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
        self.audioFileAlbumArtURL = audioFileAlbumArtURL
        self.localAudioURL = localAudioURL
        self.bpm = bpm
        self.embedding = embedding
        self.durationSeconds = durationSeconds
        self.appleMusicURL = appleMusicURL
        self.discogsURL = discogsURL
        self.youtubeURL = youtubeURL
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
        albumThumbnailURL = Self.decodeOptionalString(forKey: .albumThumbnailURL, from: container)
        audioFileAlbumArtURL = Self.decodeOptionalString(forKey: .audioFileAlbumArtURL, from: container)
        localAudioURL = try container.decodeIfPresent(String.self, forKey: .localAudioURL)
        bpm = Self.decodeOptionalDouble(forKey: .bpm, from: container)
        durationSeconds = Self.decodeOptionalDouble(forKey: .durationSeconds, from: container)
        embedding = Self.decodeOptionalEmbedding(from: container)
        appleMusicURL = Self.decodeOptionalString(forKey: .appleMusicURL, from: container)
        discogsURL = Self.decodeOptionalString(forKey: .discogsURL, from: container)
        youtubeURL = Self.decodeOptionalString(forKey: .youtubeURL, from: container)

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

    private static func normalizedArtworkURL(from rawURLString: String, relativeTo serverURL: URL?) -> URL? {
        let trimmed = rawURLString.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }

        if let serverURL,
           var components = URLComponents(string: trimmed) {
            if components.scheme == nil, components.host == nil {
                return URL(string: trimmed, relativeTo: serverURL)?.absoluteURL
            }

            if let host = components.host?.lowercased(), Self.isLocalArtworkHost(host) {
                components.scheme = serverURL.scheme
                components.host = serverURL.host
                components.port = serverURL.port
                return components.url
            }
        }

        return URL(string: trimmed)
    }

    private static func isLocalArtworkHost(_ host: String) -> Bool {
        host == "localhost" || host == "127.0.0.1" || host.hasSuffix(".local")
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
    let albumRating: Double?
    let albumNotes: String?
    let purchasePrice: Double?
    let condition: String?

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
        coverArtURL(relativeTo: nil)
    }

    func coverArtURL(relativeTo serverURL: URL?) -> URL? {
        guard let coverURLString = coverURLString?.nonEmpty else { return nil }
        return Self.normalizedArtworkURL(from: coverURLString, relativeTo: serverURL)
    }

    private static func normalizedArtworkURL(from rawURLString: String, relativeTo serverURL: URL?) -> URL? {
        let trimmed = rawURLString.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }

        if let serverURL,
           var components = URLComponents(string: trimmed) {
            if components.scheme == nil, components.host == nil {
                return URL(string: trimmed, relativeTo: serverURL)?.absoluteURL
            }

            if let host = components.host?.lowercased(), Self.isLocalArtworkHost(host) {
                components.scheme = serverURL.scheme
                components.host = serverURL.host
                components.port = serverURL.port
                return components.url
            }
        }

        return URL(string: trimmed)
    }

    private static func isLocalArtworkHost(_ host: String) -> Bool {
        host == "localhost" || host == "127.0.0.1" || host.hasSuffix(".local")
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
        case albumRating = "album_rating"
        case albumNotes = "album_notes"
        case purchasePrice = "purchase_price"
        case condition
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
        trackCount: Int?,
        albumRating: Double? = nil,
        albumNotes: String? = nil,
        purchasePrice: Double? = nil,
        condition: String? = nil
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
        self.albumRating = albumRating
        self.albumNotes = albumNotes
        self.purchasePrice = purchasePrice
        self.condition = condition
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
        albumRating = Self.decodeLossyDouble(forKey: .albumRating, from: container)
        albumNotes = Self.decodeLossyString(forKey: .albumNotes, from: container)
        purchasePrice = Self.decodeLossyDouble(forKey: .purchasePrice, from: container)
        condition = Self.decodeLossyString(forKey: .condition, from: container)
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

    private static func decodeLossyDouble(
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

struct PlaylistTrackRefDecodable: Decodable, Hashable {
    let trackID: String
    let friendID: Int

    enum CodingKeys: String, CodingKey {
        case trackID = "track_id"
        case friendID = "friend_id"
    }
}

struct PatchPlaylistRequest: Encodable {
    let id: Int
    let tracks: [PlaylistTrackRef]
}

struct UpdateAlbumRequest: Encodable {
    let release_id: String
    let friend_id: Int
    let album_rating: Double
    let album_notes: String
    let purchase_price: Double
    let condition: String
    let library_identifier: String
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

struct AlbumPlayableStructureResponse: Decodable {
    let releaseID: String?
    let friendID: Int?
    let sides: [AlbumPlayableStructureSide]
    let tracks: [AlbumPlayableStructureTrack]

    enum CodingKeys: String, CodingKey {
        case releaseID = "release_id"
        case friendID = "friend_id"
        case sides
        case tracks
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        releaseID = try container.decodeIfPresent(String.self, forKey: .releaseID)
        friendID = try container.decodeIfPresent(Int.self, forKey: .friendID)
        sides = try container.decodeIfPresent([AlbumPlayableStructureSide].self, forKey: .sides) ?? []
        tracks = try container.decodeIfPresent([AlbumPlayableStructureTrack].self, forKey: .tracks)
            ?? sides.flatMap(\.tracks)
    }
}

struct AlbumPlayableStructureSide: Decodable, Hashable, Identifiable {
    let sideKey: String
    let label: String?
    let trackCount: Int?
    let tracks: [AlbumPlayableStructureTrack]

    var id: String { sideKey }
    var displayLabel: String { label?.nonEmpty ?? sideKey }

    enum CodingKeys: String, CodingKey {
        case sideKey = "side_key"
        case key
        case label
        case trackCount = "track_count"
        case tracks
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        sideKey = try container.decodeIfPresent(String.self, forKey: .sideKey)
            ?? container.decode(String.self, forKey: .key)
        label = try container.decodeIfPresent(String.self, forKey: .label)
        trackCount = try container.decodeIfPresent(Int.self, forKey: .trackCount)
        tracks = try container.decodeIfPresent([AlbumPlayableStructureTrack].self, forKey: .tracks) ?? []
    }
}

struct AlbumPlayableStructureTrack: Decodable, Hashable, Identifiable {
    let trackID: String
    let friendID: Int?
    let position: String?
    let title: String?
    let artist: String?
    let sideKey: String?
    let duration: String?

    var id: String { trackID }
    var displayTitle: String { title?.nonEmpty ?? trackID }
    var displayArtist: String? { artist?.nonEmpty }

    enum CodingKeys: String, CodingKey {
        case trackID = "track_id"
        case friendID = "friend_id"
        case position
        case title
        case artist
        case artistName = "artist_name"
        case sideKey = "side_key"
        case duration
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        trackID = try container.decode(String.self, forKey: .trackID)
        friendID = try container.decodeIfPresent(Int.self, forKey: .friendID)
        position = try container.decodeIfPresent(String.self, forKey: .position)
        title = try container.decodeIfPresent(String.self, forKey: .title)
        duration = try container.decodeIfPresent(String.self, forKey: .duration)
        sideKey = try container.decodeIfPresent(String.self, forKey: .sideKey)

        if let artist = try container.decodeIfPresent(String.self, forKey: .artist), !artist.isEmpty {
            self.artist = artist
        } else if let artistName = try container.decodeIfPresent(String.self, forKey: .artistName), !artistName.isEmpty {
            artist = artistName
        } else {
            artist = nil
        }
    }
}

struct SpinSession: Decodable, Hashable, Identifiable {
    let serverID: Int?
    let friendID: Int?
    let releaseID: String?
    let playedAt: String?
    let note: String?
    let contextType: String?
    let selection: SpinSelection?
    let trackEvents: [TrackSpinEvent]
    let derived: SpinDerived?

    var id: String {
        if let serverID {
            return "spin-\(serverID)"
        }
        return spinFallbackIdentifier(
            friendID: friendID,
            releaseID: releaseID,
            playedAt: playedAt,
            contextType: contextType,
            note: note
        )
    }

    enum CodingKeys: String, CodingKey {
        case id
        case spinID = "spin_id"
        case sessionID = "session_id"
        case friendID = "friend_id"
        case releaseID = "release_id"
        case playedAt = "played_at"
        case createdAt = "created_at"
        case loggedAt = "logged_at"
        case timestamp
        case note
        case contextType = "context_type"
        case selection
        case trackEvents = "track_events"
        case derived
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        serverID = try container.decodeLossyIntIfPresent(forKeys: [.id, .spinID, .sessionID])
        friendID = try container.decodeIfPresent(Int.self, forKey: .friendID)
        releaseID = try container.decodeIfPresent(String.self, forKey: .releaseID)
        playedAt = try container.decodeFlexibleDateStringIfPresent(
            forKeys: [.playedAt, .createdAt, .loggedAt, .timestamp]
        )
        note = try container.decodeIfPresent(String.self, forKey: .note)
        contextType = try container.decodeIfPresent(String.self, forKey: .contextType)
        selection = try container.decodeIfPresent(SpinSelection.self, forKey: .selection)
        trackEvents = try container.decodeIfPresent([TrackSpinEvent].self, forKey: .trackEvents) ?? []
        derived = try container.decodeIfPresent(SpinDerived.self, forKey: .derived)
    }
}

struct SpinSelection: Decodable, Hashable {
    let sideKeys: [String]
    let trackRefs: [PlaylistTrackRefDecodable]

    enum CodingKeys: String, CodingKey {
        case sideKeys = "side_keys"
        case trackRefs = "track_refs"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        sideKeys = try container.decodeIfPresent([String].self, forKey: .sideKeys) ?? []
        trackRefs = try container.decodeIfPresent([PlaylistTrackRefDecodable].self, forKey: .trackRefs) ?? []
    }
}

struct TrackSpinEvent: Decodable, Hashable, Identifiable {
    let trackID: String
    let friendID: Int?
    let position: String?
    let title: String?
    let artist: String?

    var id: String { trackID }

    enum CodingKeys: String, CodingKey {
        case trackID = "track_id"
        case friendID = "friend_id"
        case position
        case title
        case artist
        case artistName = "artist_name"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        trackID = try container.decode(String.self, forKey: .trackID)
        friendID = try container.decodeIfPresent(Int.self, forKey: .friendID)
        position = try container.decodeIfPresent(String.self, forKey: .position)
        title = try container.decodeIfPresent(String.self, forKey: .title)

        if let artist = try container.decodeIfPresent(String.self, forKey: .artist), !artist.isEmpty {
            self.artist = artist
        } else if let artistName = try container.decodeIfPresent(String.self, forKey: .artistName), !artistName.isEmpty {
            artist = artistName
        } else {
            artist = nil
        }
    }
}

struct SpinDerived: Decodable, Hashable {
    let trackCount: Int?
    let sideCount: Int?
    let sideKeys: [String]

    enum CodingKeys: String, CodingKey {
        case trackCount = "track_count"
        case sideCount = "side_count"
        case sideKeys = "side_keys"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        trackCount = try container.decodeIfPresent(Int.self, forKey: .trackCount)
        sideCount = try container.decodeIfPresent(Int.self, forKey: .sideCount)
        sideKeys = try container.decodeIfPresent([String].self, forKey: .sideKeys) ?? []
    }
}

struct SpinListItem: Decodable, Hashable, Identifiable {
    let serverID: Int?
    let friendID: Int?
    let releaseID: String?
    let playedAt: String?
    let note: String?
    let contextType: String?
    let selection: SpinSelection?
    let trackEvents: [TrackSpinEvent]
    let derived: SpinDerived?

    var id: String {
        if let serverID {
            return "spin-\(serverID)"
        }
        return spinFallbackIdentifier(
            friendID: friendID,
            releaseID: releaseID,
            playedAt: playedAt,
            contextType: contextType,
            note: note
        )
    }

    enum CodingKeys: String, CodingKey {
        case id
        case spinID = "spin_id"
        case sessionID = "session_id"
        case friendID = "friend_id"
        case releaseID = "release_id"
        case playedAt = "played_at"
        case createdAt = "created_at"
        case loggedAt = "logged_at"
        case timestamp
        case note
        case contextType = "context_type"
        case selection
        case trackEvents = "track_events"
        case derived
    }

    init(from decoder: Decoder) throws {
        if let nested = try SpinListItem.decodeFromNestedContainerIfPresent(decoder) {
            self = nested
            return
        }

        let container = try decoder.container(keyedBy: CodingKeys.self)
        serverID = try container.decodeLossyIntIfPresent(forKeys: [.id, .spinID, .sessionID])
        friendID = try container.decodeIfPresent(Int.self, forKey: .friendID)
        releaseID = try container.decodeIfPresent(String.self, forKey: .releaseID)
        playedAt = try container.decodeFlexibleDateStringIfPresent(
            forKeys: [.playedAt, .createdAt, .loggedAt, .timestamp]
        )
        note = try container.decodeIfPresent(String.self, forKey: .note)
        contextType = try container.decodeIfPresent(String.self, forKey: .contextType)
        selection = try container.decodeIfPresent(SpinSelection.self, forKey: .selection)
        trackEvents = try container.decodeIfPresent([TrackSpinEvent].self, forKey: .trackEvents) ?? []
        derived = try container.decodeIfPresent(SpinDerived.self, forKey: .derived)
    }

    private static func decodeFromNestedContainerIfPresent(_ decoder: Decoder) throws -> SpinListItem? {
        let container = try decoder.container(keyedBy: DynamicCodingKeys.self)
        let nestedKeys = ["spin", "session", "item", "data"]

        for keyName in nestedKeys {
            let key = DynamicCodingKeys(keyName)
            if container.contains(key),
               let nestedItem = try container.decodeIfPresent(SpinListItem.self, forKey: key) {
                return nestedItem
            }
        }

        return nil
    }
}

struct SpinListResponse: Decodable {
    let items: [SpinListItem]

    enum CodingKeys: String, CodingKey {
        case items
        case spins
        case results
        case data
    }

    init(from decoder: Decoder) throws {
        if let singleValueContainer = try? decoder.singleValueContainer(),
           let items = try? singleValueContainer.decode([SpinListItem].self) {
            self.items = items
            return
        }

        let container = try decoder.container(keyedBy: CodingKeys.self)
        items = try container.decodeIfPresent([SpinListItem].self, forKey: .items)
            ?? container.decodeIfPresent([SpinListItem].self, forKey: .spins)
            ?? container.decodeIfPresent([SpinListItem].self, forKey: .results)
            ?? container.decodeIfPresent([SpinListItem].self, forKey: .data)
            ?? []
    }
}

struct SpinCreateRequest: Encodable {
    let friend_id: Int
    let release_id: String
    let played_at: String
    let note: String?
    let context_type: String?
    let side_keys: [String]?
    let track_refs: [PlaylistTrackRef]?
}

struct SpinCreateResponse: Decodable {
    let spin: SpinSession?

    init(spin: SpinSession?) {
        self.spin = spin
    }

    init(from decoder: Decoder) throws {
        if let singleValueContainer = try? decoder.singleValueContainer(),
           let spin = try? singleValueContainer.decode(SpinSession.self) {
            self.spin = spin
            return
        }

        let container = try decoder.container(keyedBy: DynamicCodingKeys.self)
        spin = try container.decodeIfPresent(SpinSession.self, forKey: DynamicCodingKeys("spin"))
            ?? container.decodeIfPresent(SpinSession.self, forKey: DynamicCodingKeys("session"))
            ?? container.decodeIfPresent(SpinSession.self, forKey: DynamicCodingKeys("item"))
    }
}

struct RecommendationsBatchRequest: Encodable {
    let tracks: [PlaylistTrackRef]
    let limit_identity: Int
    let limit_audio: Int
}

struct TrackBatchRequest: Encodable {
    let tracks: [PlaylistTrackRef]
}

struct RecommendationCandidateMetadata: Decodable {
    let title: String
    let artist: String
    let album: String
    let bpm: Double?
    let albumThumbnail: String?
}

struct RecommendationCandidate: Decodable {
    let trackId: String
    let friendId: Int
    let simIdentity: Double?
    let simAudio: Double?
    let metadata: RecommendationCandidateMetadata
}

struct RecommendationsResponse: Decodable {
    let candidates: [RecommendationCandidate]
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

private struct DynamicCodingKeys: CodingKey {
    var stringValue: String
    var intValue: Int?

    init(_ stringValue: String) {
        self.stringValue = stringValue
        intValue = nil
    }

    init?(stringValue: String) {
        self.stringValue = stringValue
        intValue = nil
    }

    init?(intValue: Int) {
        stringValue = String(intValue)
        self.intValue = intValue
    }
}

private extension KeyedDecodingContainer {
    func decodeLossyIntIfPresent(forKeys keys: [Key]) throws -> Int? {
        for key in keys {
            if let intValue = try decodeIfPresent(Int.self, forKey: key) {
                return intValue
            }
            if let stringValue = try decodeIfPresent(String.self, forKey: key),
               let intValue = Int(stringValue) {
                return intValue
            }
        }
        return nil
    }

    func decodeFlexibleDateStringIfPresent(forKeys keys: [Key]) throws -> String? {
        for key in keys {
            if let stringValue = try decodeIfPresent(String.self, forKey: key),
               !stringValue.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                return stringValue
            }
            if let intValue = try decodeIfPresent(Int.self, forKey: key) {
                return Self.iso8601String(fromUnixTimestamp: Double(intValue))
            }
            if let doubleValue = try decodeIfPresent(Double.self, forKey: key) {
                return Self.iso8601String(fromUnixTimestamp: doubleValue)
            }
        }
        return nil
    }

    private static func iso8601String(fromUnixTimestamp timestamp: Double) -> String {
        let normalizedTimestamp = timestamp > 9_999_999_999 ? timestamp / 1000 : timestamp
        return spinDecodedDateFormatter.string(from: Date(timeIntervalSince1970: normalizedTimestamp))
    }
}

private let spinDecodedDateFormatter: ISO8601DateFormatter = {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter
}()

private func spinFallbackIdentifier(
    friendID: Int?,
    releaseID: String?,
    playedAt: String?,
    contextType: String?,
    note: String?
) -> String {
    [
        friendID.map(String.init),
        releaseID?.nonEmpty,
        playedAt?.nonEmpty,
        contextType?.nonEmpty,
        note?.nonEmpty
    ]
    .compactMap { $0 }
    .joined(separator: "|")
}
