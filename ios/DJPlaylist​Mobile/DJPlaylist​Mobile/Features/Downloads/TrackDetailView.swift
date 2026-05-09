import SwiftUI

struct TrackDetailView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var audioPlayer: AudioPlayerService
    @StateObject private var downloadService = DownloadService()

    let track: Track

    @State private var detailTrack: Track?
    @State private var selectedAlbum: Album?
    @State private var relatedPlaylists: [Playlist] = []
    @State private var isLoading = false
    @State private var isLoadingRelatedPlaylists = false
    @State private var isDownloading = false
    @State private var errorMessage: String?
    @State private var showSimilarVibes = false
    @State private var similarTracks: [Track] = []
    @State private var isLoadingSimilar = false
    @State private var similarError: String?
    @State private var showAddToPlaylist = false
    @State private var allPlaylists: [Playlist] = []
    @State private var isLoadingAllPlaylists = false
    @State private var addToPlaylistError: String?
    @State private var addedToPlaylistName: String?

    private var displayTrack: Track { detailTrack ?? track }

    private var service: PlaylistService? {
        guard let url = appState.normalizedServerURL else { return nil }
        return PlaylistService(client: APIClient(serverURL: url))
    }

    private var client: APIClient? {
        guard let url = appState.normalizedServerURL else { return nil }
        return APIClient(serverURL: url)
    }

    private var downloadedFiles: Set<String> {
        Set(downloadService.downloadedFiles)
    }

    private var relatedAlbum: Album? {
        guard let releaseID = displayTrack.releaseID,
              let friendID = displayTrack.friendID else {
            return nil
        }

        return Album(
            rawID: nil,
            releaseID: releaseID,
            friendID: friendID,
            artist: displayTrack.artist,
            name: displayTrack.albumName,
            physicalIdentifier: displayTrack.physicalIdentifier,
            coverURLString: displayTrack.albumThumbnailURL,
            year: nil,
            label: nil,
            format: nil,
            genres: nil,
            styles: nil,
            trackCount: nil
        )
    }

    var body: some View {
        List {
            Section {
                header
            }

            Section("Metadata") {
                metadataRow("Title", value: displayTrack.displayTitle)
                metadataRow("Artist", value: displayTrack.displayArtist)
                metadataRow("Album", value: displayTrack.albumName)
                metadataRow("Position", value: displayTrack.position)
                metadataRow("Duration", value: displayTrack.displayDuration)
                metadataRow("BPM", value: displayTrack.bpm.map { String(format: "%.1f", $0) })
                metadataRow("Track ID", value: displayTrack.trackID)
                metadataRow("Release ID", value: displayTrack.releaseID)
                metadataRow("Friend ID", value: displayTrack.friendID.map(String.init))
                metadataRow("Physical ID", value: displayTrack.physicalIdentifier)
                metadataRow("Audio URL", value: displayTrack.localAudioURL)
            }

            Section("In Playlists") {
                if isLoadingRelatedPlaylists {
                    ProgressView("Loading playlists...")
                } else if relatedPlaylists.isEmpty {
                    Text("This track is not in any playlists.")
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(relatedPlaylists) { playlist in
                        relatedPlaylistRow(for: playlist)
                    }
                }
            }
        }
        .overlay {
            if isLoading {
                ProgressView("Loading track...")
            }
        }
        .navigationTitle(displayTrack.displayTitle)
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(item: $selectedAlbum) { album in
            AlbumDetailView(album: album)
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button("Play", systemImage: "play.fill") {
                        togglePlayback()
                    }
                    .disabled(!displayTrack.isPlayable)

                    Button(isTrackDownloaded ? "Downloaded" : "Download", systemImage: isTrackDownloaded ? "checkmark.circle.fill" : "arrow.down.circle") {
                        Task { await downloadTrack() }
                    }
                    .disabled(isTrackDownloaded || isDownloading || !isTrackDownloadable)

                    if let album = relatedAlbum {
                        Button("Go to Album", systemImage: "opticaldisc") {
                            selectedAlbum = album
                        }
                    }

                    Button("Similar Vibes", systemImage: "waveform.path") {
                        showSimilarVibes = true
                    }

                    Button("Add to Playlist", systemImage: "text.badge.plus") {
                        showAddToPlaylist = true
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .task {
            downloadService.refreshDownloadedFiles()
            await loadTrackDetail()
            await loadRelatedPlaylists()
        }
        .onChange(of: audioPlayer.errorMessage) { _, newValue in
            if let newValue {
                errorMessage = newValue
            }
        }
        .alert("Error", isPresented: .constant(errorMessage != nil)) {
            Button("OK") { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "Unknown error")
        }
        .sheet(isPresented: $showSimilarVibes) {
            similarVibesSheet
        }
        .sheet(isPresented: $showAddToPlaylist) {
            addToPlaylistSheet
        }
        .miniPlayerSpacer()
    }

    private var header: some View {
        HStack(alignment: .top, spacing: 16) {
            AsyncImage(url: displayTrack.albumArtURL) { image in
                image
                    .resizable()
                    .scaledToFill()
            } placeholder: {
                ZStack {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(.quaternary)
                    Image(systemName: "music.note")
                        .font(.largeTitle)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(width: 140, height: 140)
            .clipShape(RoundedRectangle(cornerRadius: 14))

            VStack(alignment: .leading, spacing: 8) {
                Text(displayTrack.displayTitle)
                    .font(.title3)
                    .fontWeight(.bold)
                    .lineLimit(3)

                Text(displayTrack.displayArtist)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                if let albumName = displayTrack.albumName?.trimmingCharacters(in: .whitespacesAndNewlines),
                   !albumName.isEmpty {
                    Label(albumName, systemImage: "opticaldisc")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                HStack(spacing: 8) {
                    if let position = displayTrack.displayPosition {
                        tag(position)
                    }
                    if let duration = displayTrack.displayDuration {
                        tag(duration)
                    }
                    if isTrackDownloaded {
                        tag("Offline", color: .green)
                    }
                }

                Button {
                    togglePlayback()
                } label: {
                    Label(audioPlayer.currentTrackID == displayTrack.id && audioPlayer.isPlaying ? "Pause" : "Play", systemImage: playbackIconName)
                }
                .buttonStyle(.borderedProminent)
                .tint(.primary)
                .foregroundStyle(.background)
                .disabled(!displayTrack.isPlayable)
            }
        }
        .padding(.vertical, 4)
    }

    private var playbackIconName: String {
        if audioPlayer.currentTrackID == displayTrack.id {
            return audioPlayer.isPlaying ? "pause.fill" : "play.fill"
        }
        return "play.fill"
    }

    private var isTrackDownloaded: Bool {
        guard let filename = downloadFilename(for: displayTrack) else { return false }
        return downloadedFiles.contains(filename)
    }

    private var isTrackDownloadable: Bool {
        downloadFilename(for: displayTrack) != nil
    }

    private func loadTrackDetail() async {
        guard let service, let friendID = track.friendID else { return }

        isLoading = true
        defer { isLoading = false }

        do {
            detailTrack = try await service.fetchTrackDetail(trackID: track.trackID, friendID: friendID)
        } catch is CancellationError {
            return
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func loadRelatedPlaylists() async {
        guard let service, let friendID = track.friendID else { return }

        isLoadingRelatedPlaylists = true
        defer { isLoadingRelatedPlaylists = false }

        do {
            relatedPlaylists = try await service.fetchPlaylists(forTrackID: track.trackID, friendID: friendID)
        } catch is CancellationError {
            return
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func downloadTrack() async {
        guard let client else { return }

        isDownloading = true
        defer { isDownloading = false }

        do {
            try await downloadService.downloadTrack(displayTrack, using: client)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func togglePlayback() {
        guard let serverURL = appState.normalizedServerURL else {
            errorMessage = "Server URL is not configured."
            return
        }

        Task {
            do {
                try await audioPlayer.togglePlayback(for: displayTrack, serverURL: serverURL)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private var similarVibesSheet: some View {
        NavigationStack {
            List(similarTracks) { similarTrack in
                NavigationLink {
                    TrackDetailView(track: similarTrack)
                        .environmentObject(appState)
                        .environmentObject(audioPlayer)
                } label: {
                    HStack(alignment: .top, spacing: 12) {
                        AsyncImage(url: similarTrack.albumArtURL) { image in
                            image
                                .resizable()
                                .scaledToFill()
                        } placeholder: {
                            ZStack {
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(.quaternary)
                                Image(systemName: "music.note")
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .frame(width: 48, height: 48)
                        .clipShape(RoundedRectangle(cornerRadius: 10))

                        VStack(alignment: .leading, spacing: 4) {
                            Text(similarTrack.displayTitle)
                                .font(.headline)
                                .lineLimit(2)

                            Text(similarTrack.displayArtist)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)

                            if let bpm = similarTrack.bpm {
                                Text("\(String(format: "%.0f", bpm)) BPM")
                                    .font(.caption)
                                    .foregroundStyle(.tertiary)
                            }
                        }
                    }
                }
            }
            .overlay {
                if isLoadingSimilar {
                    ProgressView("Finding similar vibes...")
                } else if let similarError {
                    ContentUnavailableView(
                        "Error",
                        systemImage: "exclamationmark.triangle",
                        description: Text(similarError)
                    )
                } else if similarTracks.isEmpty {
                    ContentUnavailableView(
                        "No Similar Tracks",
                        systemImage: "waveform.path",
                        description: Text("No tracks with similar vibes were found.")
                    )
                }
            }
            .navigationTitle("Similar Vibes")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        showSimilarVibes = false
                    }
                }
            }
            .task {
                await loadSimilarTracks()
            }
        }
    }

    private func loadSimilarTracks() async {
        guard let service, let friendID = displayTrack.friendID else { return }

        isLoadingSimilar = true
        similarError = nil
        defer { isLoadingSimilar = false }

        do {
            similarTracks = try await service.fetchSimilarTracks(trackID: displayTrack.trackID, friendID: friendID)
        } catch is CancellationError {
            return
        } catch {
            similarError = error.localizedDescription
        }
    }

    private var addToPlaylistSheet: some View {
        NavigationStack {
            List(allPlaylists) { playlist in
                Button {
                    Task {
                        await addTrack(to: playlist)
                    }
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(playlist.name)
                                .foregroundStyle(.primary)

                            if let count = playlist.tracks?.count {
                                Text("\(count) tracks")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }

                        Spacer()

                        if relatedPlaylists.contains(where: { $0.id == playlist.id }) {
                            Image(systemName: "checkmark")
                                .foregroundStyle(.green)
                        }
                    }
                }
            }
            .overlay {
                if isLoadingAllPlaylists {
                    ProgressView("Loading playlists...")
                } else if let addToPlaylistError {
                    ContentUnavailableView(
                        "Error",
                        systemImage: "exclamationmark.triangle",
                        description: Text(addToPlaylistError)
                    )
                } else if allPlaylists.isEmpty {
                    ContentUnavailableView(
                        "No Playlists",
                        systemImage: "music.note.list",
                        description: Text("Create a playlist first.")
                    )
                }
            }
            .navigationTitle("Add to Playlist")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        showAddToPlaylist = false
                    }
                }
            }
            .task {
                await loadAllPlaylists()
            }
        }
    }

    private func loadAllPlaylists() async {
        guard let service else { return }

        isLoadingAllPlaylists = true
        addToPlaylistError = nil
        defer { isLoadingAllPlaylists = false }

        do {
            allPlaylists = try await service.fetchPlaylists()
        } catch is CancellationError {
            return
        } catch {
            addToPlaylistError = error.localizedDescription
        }
    }

    private func addTrack(to playlist: Playlist) async {
        guard let service, let friendID = displayTrack.friendID else { return }

        do {
            try await service.addTrackToPlaylist(
                playlistID: playlist.id,
                trackID: displayTrack.trackID,
                friendID: friendID
            )
            addedToPlaylistName = playlist.name
            showAddToPlaylist = false
            await loadRelatedPlaylists()
        } catch {
            addToPlaylistError = error.localizedDescription
        }
    }

    @ViewBuilder
    private func metadataRow(_ title: String, value: String?) -> some View {
        if let value = value?.trimmingCharacters(in: .whitespacesAndNewlines), !value.isEmpty {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(value)
                    .textSelection(.enabled)
            }
            .padding(.vertical, 2)
        }
    }

    private func tag(_ text: String, color: Color = .blue) -> some View {
        Text(text)
            .font(.caption)
            .fontWeight(.medium)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.14))
            .foregroundStyle(color)
            .clipShape(Capsule())
    }

    private func formatDate(_ dateString: String) -> String {
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = iso.date(from: dateString) ?? ISO8601DateFormatter().date(from: dateString) {
            let formatter = DateFormatter()
            formatter.dateStyle = .medium
            formatter.timeStyle = .none
            return formatter.string(from: date)
        }
        return dateString
    }

    private func relatedPlaylistRow(for playlist: Playlist) -> some View {
        NavigationLink {
            PlaylistDetailView(playlist: playlist)
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(playlist.name)
                        .foregroundStyle(.primary)

                    HStack(spacing: 10) {
                        if let createdAt = playlist.createdAt {
                            Label(formatDate(createdAt), systemImage: "calendar")
                        }
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }

                Spacer()
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func downloadFilename(for track: Track) -> String? {
        guard let localAudioURL = track.localAudioURL?.trimmingCharacters(in: .whitespacesAndNewlines),
              !localAudioURL.isEmpty else {
            return nil
        }

        if let parsed = URL(string: localAudioURL) {
            if let nestedFilename = URLComponents(url: parsed, resolvingAgainstBaseURL: false)?
                .queryItems?
                .first(where: { $0.name == "filename" })?
                .value?
                .trimmingCharacters(in: .whitespacesAndNewlines),
               !nestedFilename.isEmpty {
                return nestedFilename
            }

            let lastPathComponent = parsed.lastPathComponent.trimmingCharacters(in: .whitespacesAndNewlines)
            if !lastPathComponent.isEmpty {
                return lastPathComponent
            }
        }

        let fallback = localAudioURL
            .replacingOccurrences(of: "app/audio/", with: "")
            .replacingOccurrences(of: "audio/", with: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return fallback.isEmpty ? nil : fallback
    }
}
