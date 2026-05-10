import SwiftUI

struct PlaylistDetailView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var audioPlayer: AudioPlayerService

    let playlist: Playlist

    @State private var tracks: [Track] = []
    @State private var isLoadingTracks = false
    @State private var errorMessage: String?
    @State private var showSimilarVibes = false
    @State private var similarVibesTrack: Track?
    @State private var similarTracks: [Track] = []
    @State private var isLoadingSimilar = false
    @State private var similarError: String?
    @State private var removingTrackIDs: Set<String> = []

    private var service: PlaylistService? {
        guard let url = appState.normalizedServerURL else { return nil }
        return PlaylistService(client: APIClient(serverURL: url))
    }

    var body: some View {
        Group {
            if isLoadingTracks {
                ProgressView("Loading tracks...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if tracks.isEmpty {
                ContentUnavailableView(
                    "No Tracks",
                    systemImage: "music.note.list",
                    description: Text("This playlist did not return any tracks.")
                )
            } else {
                List {
                    Section {
                        HStack(spacing: 12) {
                            Label("\(tracks.count) tracks", systemImage: "music.note")
                            if let duration = totalDuration {
                                Label(duration, systemImage: "clock")
                            }
                            if let createdAt = playlist.createdAt {
                                Label(formatDate(createdAt), systemImage: "calendar")
                            }
                        }
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    }

                    Section {
                        ForEach(tracks) { track in
                            trackRow(for: track)
                        }
                    }
                }
            }
        }
        .navigationTitle(playlist.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button("Play Playlist", systemImage: "text.line.first.and.arrowtriangle.forward") {
                        playPlaylist()
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .task {
            await loadTracks()
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
        .miniPlayerSpacer()
    }

    private func loadTracks() async {
        guard let service else { return }

        isLoadingTracks = true
        defer { isLoadingTracks = false }

        do {
            tracks = try await service.fetchTracks(for: playlist.id)
        } catch is CancellationError {
            return
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

    private func playPlaylist() {
        guard let serverURL = appState.normalizedServerURL else {
            errorMessage = "Server URL is not configured."
            return
        }
        guard !tracks.isEmpty else {
            errorMessage = "There are no playable tracks in this playlist."
            return
        }

        Task {
            do {
                try await audioPlayer.playQueuedPlaylist(tracks, serverURL: serverURL)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func removeTrackFromPlaylist(_ track: Track) {
        guard let service else { return }
        let updatedTracks = tracks.filter { !isSamePlaylistEntry($0, as: track) }
        guard updatedTracks.count != tracks.count else { return }

        removingTrackIDs.insert(track.id)

        Task {
            do {
                try await service.updatePlaylistTracks(playlistID: playlist.id, tracks: updatedTracks)
                tracks = updatedTracks
            } catch {
                errorMessage = error.localizedDescription
            }
            removingTrackIDs.remove(track.id)
        }
    }

    private func isSamePlaylistEntry(_ lhs: Track, as rhs: Track) -> Bool {
        if let lhsFriendID = lhs.friendID, let rhsFriendID = rhs.friendID {
            return lhs.trackID == rhs.trackID && lhsFriendID == rhsFriendID
        }
        return lhs.trackID == rhs.trackID
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

    private var totalDuration: String? {
        var totalSeconds = 0.0
        for track in tracks {
            if let seconds = track.durationSeconds, seconds > 0 {
                totalSeconds += seconds
            } else if let d = track.duration {
                let parts = d.split(separator: ":").compactMap { Int($0) }
                if parts.count == 2 {
                    totalSeconds += Double(parts[0] * 60 + parts[1])
                } else if parts.count == 3 {
                    totalSeconds += Double(parts[0] * 3600 + parts[1] * 60 + parts[2])
                }
            }
        }

        guard totalSeconds > 0 else { return nil }
        let total = Int(totalSeconds)
        let hours = total / 3600
        let minutes = (total % 3600) / 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        }
        return "\(minutes)m"
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
                        AsyncImage(url: similarTrack.albumArtURL(relativeTo: appState.normalizedServerURL)) { image in
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

    private func trackRow(for track: Track) -> some View {
        HStack(alignment: .top, spacing: 12) {
            NavigationLink {
                TrackDetailView(track: track)
            } label: {
                HStack(alignment: .top, spacing: 12) {
                    AsyncImage(url: track.albumArtURL(relativeTo: appState.normalizedServerURL)) { image in
                        image
                            .resizable()
                            .scaledToFill()
                    } placeholder: {
                        ZStack {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(.quaternary)
                            Image(systemName: "music.note")
                                .foregroundStyle(.secondary)
                        }
                    }
                    .frame(width: 56, height: 56)
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                    VStack(alignment: .leading, spacing: 4) {
                        Text(track.displayTitle)
                            .font(.headline)
                            .foregroundStyle(.primary)
                            .lineLimit(2)

                        Text(track.displayArtist)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)

                        HStack(spacing: 8) {
                            if let position = track.displayPosition {
                                Label(position, systemImage: "square.grid.2x2")
                            }
                            if let duration = track.displayDuration {
                                Label(duration, systemImage: "clock")
                            }
                        }
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                    }
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

        }
        .padding(.vertical, 2)
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
            Button("Remove from Playlist", systemImage: "minus.circle", role: .destructive) {
                removeTrackFromPlaylist(track)
            }
            .disabled(removingTrackIDs.contains(track.id))
        }
    }
}
