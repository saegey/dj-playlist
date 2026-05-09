import SwiftUI

struct TracksView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var audioPlayer: AudioPlayerService
    @State private var tracks: [Track] = []
    @State private var friends: [Friend] = []
    @State private var selectedFriendID: Int?
    @State private var hasAppliedDefault = false
    @State private var searchText = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var playerError: String?

    private var activeFriendID: Int? { selectedFriendID }

    private var selectedFriendName: String {
        if let selectedFriendID,
           let friend = friends.first(where: { $0.id == selectedFriendID }) {
            return friend.username
        }
        return "All Libraries"
    }

    var body: some View {
        NavigationStack {
            List(tracks) { track in
                HStack(alignment: .center, spacing: 12) {
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
                    .frame(width: 48, height: 48)
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                    VStack(alignment: .leading, spacing: 2) {
                        Text(track.displayTitle)
                            .font(.body)
                            .lineLimit(1)

                        Text(track.displayArtist)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }

                    Spacer(minLength: 0)

                    if let duration = track.displayDuration {
                        Text(duration)
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                            .monospacedDigit()
                    }

                    Button {
                        guard let serverURL = appState.normalizedServerURL else { return }
                        Task {
                            do {
                                try await audioPlayer.togglePlayback(for: track, serverURL: serverURL)
                            } catch {
                                playerError = error.localizedDescription
                            }
                        }
                    } label: {
                        Image(systemName: audioPlayer.currentTrackID == track.id && audioPlayer.isPlaying
                              ? "pause.circle.fill"
                              : "play.circle.fill")
                            .font(.title2)
                            .foregroundStyle(.tint)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.vertical, 4)
                .alignmentGuide(.listRowSeparatorLeading) { _ in 0 }
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
                    playerError = newValue
                }
            }
            .alert("Error", isPresented: .constant(errorMessage != nil)) {
                Button("OK") { errorMessage = nil }
            } message: {
                Text(errorMessage ?? "Unknown error")
            }
            .alert("Playback Error", isPresented: .constant(playerError != nil)) {
                Button("OK") { playerError = nil }
            } message: {
                Text(playerError ?? "Unknown error")
            }
        }
    }

    private var service: PlaylistService? {
        guard let url = appState.normalizedServerURL else { return nil }
        return PlaylistService(client: APIClient(serverURL: url))
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
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    TracksView()
        .environmentObject(AppState())
        .environmentObject(AudioPlayerService())
}
