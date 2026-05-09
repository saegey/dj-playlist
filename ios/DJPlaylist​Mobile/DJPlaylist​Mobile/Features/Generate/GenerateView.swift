import SwiftUI

struct AlbumsView: View {
    @EnvironmentObject private var appState: AppState
    @State private var albums: [Album] = []
    @State private var friends: [Friend] = []
    @State private var selectedFriendID: Int?
    @State private var hasAppliedDefault = false
    @State private var searchText = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

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
            List(albums) { album in
                NavigationLink(value: album) {
                    HStack(alignment: .top, spacing: 12) {
                        AsyncImage(url: album.coverArtURL) { image in
                            image
                                .resizable()
                                .scaledToFill()
                        } placeholder: {
                            ZStack {
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(.quaternary)
                                Image(systemName: "opticaldisc.fill")
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .frame(width: 64, height: 64)
                        .clipShape(RoundedRectangle(cornerRadius: 10))

                        VStack(alignment: .leading, spacing: 4) {
                            Text(album.displayArtist)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)

                            Text(album.displayName)
                                .font(.headline)
                                .lineLimit(2)

                            Text(album.displayPhysicalIdentifier)
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                                .textSelection(.enabled)
                        }

                        Spacer(minLength: 0)
                    }
                    .padding(.vertical, 4)
                    .alignmentGuide(.listRowSeparatorLeading) { _ in 0 }
                }
            }
            .navigationDestination(for: Album.self) { album in
                AlbumDetailView(album: album)
            }
            .overlay {
                if isLoading && albums.isEmpty {
                    ProgressView("Loading albums...")
                } else if !isLoading && albums.isEmpty {
                    ContentUnavailableView(
                        searchText.isEmpty ? "No Albums" : "No Results",
                        systemImage: "opticaldisc",
                        description: Text(searchText.isEmpty
                            ? "No albums were returned by the server."
                            : "Try a different search term.")
                    )
                }
            }
            .navigationTitle("Albums")
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
            .searchable(text: $searchText, prompt: "Search albums")
            .refreshable {
                await loadAlbums()
            }
            .task {
                if !hasAppliedDefault {
                    selectedFriendID = appState.defaultFriendID
                    hasAppliedDefault = true
                }
                await loadFriends()
                await loadAlbums()
            }
            .task(id: searchText) {
                guard !searchText.isEmpty else {
                    if !albums.isEmpty {
                        await loadAlbums()
                    }
                    return
                }

                try? await Task.sleep(for: .milliseconds(300))
                guard !Task.isCancelled else { return }
                await loadAlbums()
            }
            .onChange(of: selectedFriendID) {
                Task { await loadAlbums() }
            }
            .alert("Error", isPresented: .constant(errorMessage != nil)) {
                Button("OK") { errorMessage = nil }
            } message: {
                Text(errorMessage ?? "Unknown error")
            }
            .miniPlayerSpacer()
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

    private func loadAlbums() async {
        guard let service else { return }

        isLoading = true
        defer { isLoading = false }

        do {
            albums = try await service.fetchAlbums(query: searchText, friendID: activeFriendID)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    AlbumsView()
        .environmentObject(AppState())
        .environmentObject(AudioPlayerService())
}
