import SwiftUI

struct DownloadsView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var downloadService = DownloadService()

    @State private var playlists: [Playlist] = []
    @State private var selectedPlaylistID: Int?
    @State private var tracks: [Track] = []
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Choose Playlist") {
                    Picker("Playlist", selection: $selectedPlaylistID) {
                        Text("Select a playlist").tag(nil as Int?)
                        ForEach(playlists) { playlist in
                            Text(playlist.name).tag(Optional(playlist.id))
                        }
                    }

                    Button("Load Tracks") {
                        Task { await loadTracks() }
                    }
                    .disabled(selectedPlaylistID == nil)
                }

                if isLoading {
                    Section {
                        ProgressView("Working...")
                    }
                }

                if !tracks.isEmpty {
                    Section("Tracks") {
                        ForEach(tracks) { track in
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(track.title ?? "Untitled")
                                    Text(track.artist ?? "Unknown artist")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Button("Download") {
                                    Task { await download(track) }
                                }
                            }
                        }
                    }
                }

                Section("Downloaded Files") {
                    if downloadService.downloadedFiles.isEmpty {
                        Text("No offline files yet")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(downloadService.downloadedFiles, id: \.self) { filename in
                            Text(filename)
                                .font(.footnote)
                        }
                    }
                }
            }
            .navigationTitle("Downloads")
            .task {
                downloadService.refreshDownloadedFiles()
                if playlists.isEmpty {
                    await loadPlaylists()
                }
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

    private var client: APIClient? {
        guard let url = appState.normalizedServerURL else { return nil }
        return APIClient(serverURL: url)
    }

    private func loadPlaylists() async {
        guard let service else { return }
        do {
            playlists = try await service.fetchPlaylists()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func loadTracks() async {
        guard let service, let selectedPlaylistID else { return }
        isLoading = true
        defer { isLoading = false }

        do {
            tracks = try await service.fetchTracks(for: selectedPlaylistID)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func download(_ track: Track) async {
        guard let client else { return }
        isLoading = true
        defer { isLoading = false }

        do {
            try await downloadService.downloadTrack(track, using: client)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
