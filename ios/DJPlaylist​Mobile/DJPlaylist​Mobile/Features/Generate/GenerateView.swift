import SwiftUI

struct GenerateView: View {
    @EnvironmentObject private var appState: AppState
    @State private var playlists: [Playlist] = []
    @State private var selectedPlaylistID: Int?
    @State private var generatedTracks: [Track] = []
    @State private var isLoading = false
    @State private var statusText: String = ""
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Source Playlist") {
                    Picker("Playlist", selection: $selectedPlaylistID) {
                        Text("Select a playlist").tag(nil as Int?)
                        ForEach(playlists) { playlist in
                            Text(playlist.name).tag(Optional(playlist.id))
                        }
                    }
                }

                Section {
                    Button(isLoading ? "Generating..." : "Generate Optimized Playlist") {
                        Task { await generate() }
                    }
                    .disabled(isLoading || selectedPlaylistID == nil)

                    if !statusText.isEmpty {
                        Text(statusText)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }

                if !generatedTracks.isEmpty {
                    Section("Result (\(generatedTracks.count) tracks)") {
                        ForEach(generatedTracks) { track in
                            VStack(alignment: .leading) {
                                Text(track.displayTitle)
                                Text(track.displayArtist)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Generate")
            .task {
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

    private func loadPlaylists() async {
        guard let service else { return }
        do {
            playlists = try await service.fetchPlaylists()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func generate() async {
        guard let service else { return }
        guard let playlistID = selectedPlaylistID else { return }

        isLoading = true
        statusText = "Loading tracks..."
        defer { isLoading = false }

        do {
            let tracks = try await service.fetchTracks(for: playlistID)
            statusText = "Generating optimized order..."
            generatedTracks = try await service.generateGeneticPlaylist(from: tracks)
            statusText = "Done"
        } catch {
            errorMessage = error.localizedDescription
            statusText = ""
        }
    }
}
