import SwiftUI

struct TracksView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var audioPlayer: AudioPlayerService
    @StateObject private var downloadService = DownloadService()

    @State private var friends: [Friend] = []
    @State private var selectedFriendID: Int?
    @State private var hasAppliedDefault = false
    @State private var tracks: [Track] = []
    @State private var searchText = ""
    @State private var isLoading = false
    @State private var downloadingTrackIDs: Set<String> = []
    @State private var errorMessage: String?
    @State private var showSimilarVibes = false
    @State private var similarVibesTrack: Track?
    @State private var similarTracks: [Track] = []
    @State private var isLoadingSimilar = false
    @State private var similarError: String?
    @State private var showAddToPlaylist = false
    @State private var addToPlaylistTrack: Track?
    @State private var allPlaylists: [Playlist] = []
    @State private var isLoadingAllPlaylists = false
    @State private var addToPlaylistError: String?

    private var activeFriendID: Int? { selectedFriendID }

    private var selectedFriendName: String {
        if let selectedFriendID,
           let friend = friends.first(where: { $0.id == selectedFriendID }) {
            return friend.username
        }
        return "All Libraries"
    }

    private var downloadedFiles: Set<String> {
        Set(downloadService.downloadedFiles)
    }

    var body: some View {
        NavigationStack {
            List(tracks) { track in
                trackRow(for: track)
            }
            .navigationDestination(for: Track.self) { track in
                TrackDetailView(track: track)
            }
            .overlay {
                if isLoading && tracks.isEmpty {
                    ProgressView("Loading tracks...")
                } else if !isLoading && tracks.isEmpty {
                    ContentUnavailableView(
                        searchText.isEmpty ? "No Tracks" : "No Results",
                        systemImage: "music.note",
                        description: Text(searchText.isEmpty
                            ? "No tracks were returned by the server."
                            : "Try a different search term.")
                    )
                }
            }
            .navigationTitle("Tracks")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Picker("Library", selection: $selectedFriendID) {
                            Text("All Libraries")
                                .tag(nil as Int?)
                            ForEach(friends) { friend in
                                Text(friend.username)
                                    .tag(friend.id as Int?)
                            }
                        }
                    } label: {
                        Label(selectedFriendName, systemImage: "person.crop.circle")
                    }
                }
            }
            .searchable(text: $searchText, prompt: "Search tracks")
            .refreshable {
                await loadTracks()
            }
            .task {
                downloadService.refreshDownloadedFiles()
                if !hasAppliedDefault {
                    selectedFriendID = appState.defaultFriendID
                    hasAppliedDefault = true
                }
                await loadFriends()
                await loadTracks()
            }
            .task(id: searchText) {
                guard !searchText.isEmpty else {
                    if !tracks.isEmpty {
                        await loadTracks()
                    }
                    return
                }

                try? await Task.sleep(for: .milliseconds(300))
                guard !Task.isCancelled else { return }
                await loadTracks()
            }
            .onChange(of: selectedFriendID) {
                Task { await loadTracks() }
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
    }

    private var service: PlaylistService? {
        guard let url = appState.normalizedServerURL else { return nil }
        return PlaylistService(client: APIClient(serverURL: url))
    }

    private var client: APIClient? {
        guard let url = appState.normalizedServerURL else { return nil }
        return APIClient(serverURL: url)
    }

    private func loadFriends() async {
        guard let service else { return }
        do {
            friends = try await service.fetchFriends()
        } catch {
            friends = []
        }
    }

    private func loadTracks() async {
        guard let service else { return }

        isLoading = true
        defer { isLoading = false }

        do {
            tracks = try await service.searchTracks(query: searchText, friendID: activeFriendID)
        } catch is CancellationError {
            return
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func download(_ track: Track) async {
        guard let client else { return }

        downloadingTrackIDs.insert(track.id)
        defer { downloadingTrackIDs.remove(track.id) }

        do {
            try await downloadService.downloadTrack(track, using: client)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func togglePlayback(for track: Track) {
        guard let serverURL = appState.normalizedServerURL else {
            errorMessage = "Server URL is not configured."
            return
        }

        Task {
            do {
                try await audioPlayer.togglePlayback(for: track, serverURL: serverURL)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func playbackIconName(for track: Track) -> String {
        if audioPlayer.currentTrackID == track.id {
            return audioPlayer.isPlaying ? "pause.circle.fill" : "play.circle.fill"
        }
        return "play.circle"
    }

    private func downloadIconName(for track: Track) -> String {
        if downloadingTrackIDs.contains(track.id) {
            return "arrow.down.circle.dotted"
        }
        if isTrackDownloaded(track) {
            return "checkmark.circle.fill"
        }
        return trackIsDownloadable(track) ? "arrow.down.circle" : "arrow.down.circle.slash"
    }

    private func downloadIconColor(for track: Track) -> Color {
        if isTrackDownloaded(track) {
            return .green
        }
        if !trackIsDownloadable(track) {
            return .secondary
        }
        return .accentColor
    }

    private func isTrackDownloaded(_ track: Track) -> Bool {
        guard let filename = downloadFilename(for: track) else { return false }
        return downloadedFiles.contains(filename)
    }

    private func trackIsDownloadable(_ track: Track) -> Bool {
        downloadFilename(for: track) != nil
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
        guard let service,
              let track = similarVibesTrack,
              let friendID = track.friendID else { return }

        isLoadingSimilar = true
        similarError = nil
        similarTracks = []
        defer { isLoadingSimilar = false }

        do {
            similarTracks = try await service.fetchSimilarTracks(trackID: track.trackID, friendID: friendID)
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
                    Task { await addTrack(to: playlist) }
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
                    Button("Done") { showAddToPlaylist = false }
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
        guard let service,
              let track = addToPlaylistTrack,
              let friendID = track.friendID else { return }
        do {
            try await service.addTrackToPlaylist(playlistID: playlist.id, trackID: track.trackID, friendID: friendID)
            showAddToPlaylist = false
        } catch {
            addToPlaylistError = error.localizedDescription
        }
    }

    private func trackRow(for track: Track) -> some View {
        NavigationLink(value: track) {
            HStack(alignment: .top, spacing: 12) {
                AsyncImage(url: track.albumArtURL) { image in
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
                .frame(width: 64, height: 64)
                .clipShape(RoundedRectangle(cornerRadius: 10))

                VStack(alignment: .leading, spacing: 4) {
                    Text(track.displayTitle)
                        .font(.headline)
                        .lineLimit(2)

                    Text(track.displayArtist)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)

                    HStack(spacing: 8) {
                        if let albumName = track.albumName?.trimmingCharacters(in: .whitespacesAndNewlines),
                           !albumName.isEmpty {
                            Label(albumName, systemImage: "opticaldisc")
                        }
                        if let duration = track.displayDuration {
                            Label(duration, systemImage: "clock")
                        }
                        if isTrackDownloaded(track) {
                            Label("Offline", systemImage: "checkmark.circle.fill")
                                .foregroundStyle(.green)
                        }
                    }
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                }
            }
        }
        .padding(.vertical, 4)
        .alignmentGuide(.listRowSeparatorLeading) { _ in 0 }
        .contextMenu {
            Button("Play", systemImage: "play.fill") {
                togglePlayback(for: track)
            }
            .disabled(!track.isPlayable)
            Button("Similar Vibes", systemImage: "waveform.path") {
                similarVibesTrack = track
                showSimilarVibes = true
            }
            Button("Add to Playlist", systemImage: "text.badge.plus") {
                addToPlaylistTrack = track
                showAddToPlaylist = true
            }
            if !isTrackDownloaded(track) && trackIsDownloadable(track) {
                Button("Download", systemImage: "arrow.down.circle") {
                    Task { await download(track) }
                }
            }
        }
    }
}
