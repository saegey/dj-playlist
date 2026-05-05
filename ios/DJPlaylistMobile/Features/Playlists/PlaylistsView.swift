import SwiftUI

struct PlaylistsView: View {
    @EnvironmentObject private var appState: AppState
    @State private var playlists: [Playlist] = []
    @State private var selectedPlaylist: Playlist?
    @State private var tracks: [Track] = []
    @State private var isLoading = false
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
                if isLoading && playlists.isEmpty {
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
            .sheet(item: $selectedPlaylist) { playlist in
                NavigationStack {
                    List(tracks) { track in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(track.title ?? "Untitled")
                            Text(track.artist ?? "Unknown artist")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .navigationTitle(playlist.name)
                    .navigationBarTitleDisplayMode(.inline)
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

    private func loadPlaylists() async {
        guard let service else { return }

        isLoading = true
        defer { isLoading = false }

        do {
            playlists = try await service.fetchPlaylists()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func loadTracks(for playlist: Playlist) async {
        guard let service else { return }
        do {
            tracks = try await service.fetchTracks(for: playlist.id)
            selectedPlaylist = playlist
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
