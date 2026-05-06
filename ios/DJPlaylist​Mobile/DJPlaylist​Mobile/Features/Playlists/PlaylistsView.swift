import SwiftUI

struct PlaylistsView: View {
    @EnvironmentObject private var appState: AppState
    @State private var playlists: [Playlist] = []
    @State private var selectedPlaylist: Playlist?
    @State private var searchText = ""
    @State private var isLoadingPlaylists = false
    @State private var errorMessage: String?
    @State private var showCreatePlaylist = false
    @State private var newPlaylistName = ""
    @State private var isCreating = false

    private var filteredPlaylists: [Playlist] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else { return playlists }

        return playlists.filter { playlist in
            playlist.name.localizedCaseInsensitiveContains(query)
        }
    }

    var body: some View {
        NavigationStack {
            List(filteredPlaylists) { playlist in
                Button {
                    Task { await loadTracks(for: playlist) }
                } label: {
                    HStack(alignment: .top, spacing: 12) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(playlist.name)
                                .font(.headline)
                                .foregroundStyle(.primary)
                                .multilineTextAlignment(.leading)

                            VStack(alignment: .leading, spacing: 6) {
                                HStack(spacing: 12) {
                                    Label(
                                        "\(playlist.tracks?.count ?? 0) tracks",
                                        systemImage: "music.note"
                                    )

                                    if let duration = playlistDuration(for: playlist) {
                                        Label(duration, systemImage: "clock")
                                    }
                                }

                                if let createdAt = playlist.createdAt {
                                    Label(
                                        formatDate(createdAt),
                                        systemImage: "calendar"
                                    )
                                }
                            }
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        }

                        Spacer()

                        Image(systemName: "chevron.right")
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 4)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .alignmentGuide(.listRowSeparatorLeading) { _ in 0 }
            }
            .overlay {
                if isLoadingPlaylists && playlists.isEmpty {
                    ProgressView("Loading playlists...")
                } else if !isLoadingPlaylists && filteredPlaylists.isEmpty {
                    ContentUnavailableView(
                        searchText.isEmpty ? "No Playlists" : "No Results",
                        systemImage: "music.note.list",
                        description: Text(searchText.isEmpty
                            ? "No playlists were returned by the server."
                            : "Try a different search term.")
                    )
                }
            }
            .refreshable {
                await loadPlaylists()
            }
            .navigationTitle("Playlists")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button("New Playlist", systemImage: "plus") {
                            newPlaylistName = ""
                            showCreatePlaylist = true
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .alert("New Playlist", isPresented: $showCreatePlaylist) {
                TextField("Playlist name", text: $newPlaylistName)
                Button("Cancel", role: .cancel) { }
                Button("Create") {
                    Task { await createPlaylist() }
                }
                .disabled(newPlaylistName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            } message: {
                Text("Enter a name for your new playlist.")
            }
            .searchable(text: $searchText, prompt: "Search playlists")
            .task {
                await loadPlaylists()
            }
            .navigationDestination(item: $selectedPlaylist) { playlist in
                PlaylistDetailView(playlist: playlist)
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

    private func createPlaylist() async {
        let name = newPlaylistName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty, let service else { return }

        isCreating = true
        defer { isCreating = false }

        do {
            let created = try await service.createPlaylist(name: name)
            await loadPlaylists()
            selectedPlaylist = created
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func loadTracks(for playlist: Playlist) async {
        selectedPlaylist = playlist
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

    private func playlistDuration(for playlist: Playlist) -> String? {
        totalDuration(for: playlist.tracks ?? [])
    }

    private func totalDuration(for tracks: [Track]) -> String? {
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

}
