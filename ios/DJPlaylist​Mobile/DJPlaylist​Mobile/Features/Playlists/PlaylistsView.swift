import SwiftUI

struct PlaylistsView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var audioPlayer: AudioPlayerService
    @State private var playlists: [Playlist] = []
    @State private var selectedPlaylist: Playlist?
    @State private var tracks: [Track] = []
    @State private var isLoadingPlaylists = false
    @State private var isLoadingTracks = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            List(playlists) { playlist in
                Button {
                    Task { await loadTracks(for: playlist) }
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(playlist.name)
                                .font(.headline)
                            Text("ID: \(playlist.id)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()

                        Image(systemName: "chevron.right")
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .overlay {
                if isLoadingPlaylists && playlists.isEmpty {
                    ProgressView("Loading playlists...")
                }
            }
            .refreshable {
                await loadPlaylists()
            }
            .navigationTitle("Playlists")
            .task {
                if playlists.isEmpty {
                    await loadPlaylists()
                }
            }
            .onChange(of: audioPlayer.errorMessage) { _, newValue in
                if let newValue {
                    errorMessage = newValue
                }
            }
            .navigationDestination(item: $selectedPlaylist) { playlist in
                playlistDetailView(for: playlist)
            }
            .alert("Error", isPresented: .constant(errorMessage != nil)) {
                Button("OK") { errorMessage = nil }
            } message: {
                Text(errorMessage ?? "Unknown error")
            }
        }
    }

    private var service: PlaylistService? {
        guard let url = appState.normalizedServerURL else { return nil }
        return PlaylistService(client: APIClient(serverURL: url))
    }

    private func loadPlaylists() async {
        guard let service else { return }

        isLoadingPlaylists = true
        defer { isLoadingPlaylists = false }

        do {
            playlists = try await service.fetchPlaylists()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func loadTracks(for playlist: Playlist) async {
        guard let service else { return }
        selectedPlaylist = playlist
        tracks = []
        isLoadingTracks = true
        defer { isLoadingTracks = false }

        do {
            tracks = try await service.fetchTracks(for: playlist.id)
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

    @ViewBuilder
    private func playlistDetailView(for playlist: Playlist) -> some View {
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
                List(tracks) { track in
                    HStack(alignment: .top, spacing: 12) {
                        AsyncImage(url: track.albumArtURL) { image in
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

                        Spacer(minLength: 0)

                        Button {
                            togglePlayback(for: track)
                        } label: {
                            Image(systemName: playbackIconName(for: track))
                                .font(.title3)
                                .frame(width: 32, height: 32)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.vertical, 2)
                    .alignmentGuide(.listRowSeparatorLeading) { _ in 0 }
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
}
