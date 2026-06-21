import SwiftUI

struct AlbumsView: View {
    @EnvironmentObject private var appState: AppState
    @State private var albums: [Album] = []
    @State private var friends: [Friend] = []
    @State private var selectedFriendID: Int?
    @State private var hasAppliedDefault = false
    @State private var hasLoadedInitialData = false
    @State private var searchText = ""
    @State private var isLoading = false
    @State private var isLoadingMore = false
    @State private var canLoadMoreAlbums = true
    @State private var nextAlbumOffset = 0
    @State private var errorMessage: String?
    @State private var searchTask: Task<Void, Never>?
    @SceneStorage("AlbumsView.visibleAlbumID") private var visibleAlbumID: String?

    private let albumPageSize = 50
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
            List {
                ForEach(albums) { album in
                    NavigationLink(value: album) {
                        HStack(alignment: .top, spacing: 12) {
                            AsyncImage(url: album.coverArtURL(relativeTo: appState.normalizedServerURL)) { image in
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

                                if let identifier = physicalIdentifier(for: album) {
                                    Text(identifier)
                                        .font(.caption)
                                        .fontWeight(.bold)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 3)
                                        .background(.blue)
                                        .foregroundStyle(.white)
                                        .clipShape(Capsule())
                                        .textSelection(.enabled)
                                }
                            }

                            Spacer(minLength: 0)
                        }
                        .padding(.vertical, 4)
                        .alignmentGuide(.listRowSeparatorLeading) { _ in 0 }
                    }
                    .onAppear {
                        loadMoreAlbumsIfNeeded(currentAlbum: album)
                    }
                }

                if isLoadingMore {
                    HStack {
                        Spacer()
                        ProgressView()
                        Spacer()
                    }
                }
            }
            .scrollPosition(id: $visibleAlbumID, anchor: .top)
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
                await loadAlbums(reset: true)
            }
            .task {
                guard !hasLoadedInitialData else { return }

                if !hasAppliedDefault {
                    selectedFriendID = appState.defaultFriendID
                    hasAppliedDefault = true
                }
                await loadFriends()
                await loadAlbums(reset: true)
                hasLoadedInitialData = true
            }
            .onChange(of: searchText) { _, newValue in
                scheduleSearch(for: newValue)
            }
            .onChange(of: selectedFriendID) {
                guard hasLoadedInitialData else { return }
                Task { await loadAlbums(reset: true) }
            }
            .onDisappear {
                searchTask?.cancel()
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

    private func physicalIdentifier(for album: Album) -> String? {
        let identifier = album.physicalIdentifier?.trimmingCharacters(in: .whitespacesAndNewlines)
        return identifier?.isEmpty == false ? identifier : nil
    }

    private func loadFriends() async {
        guard let service else { return }
        do {
            friends = try await service.fetchFriends()
        } catch {
            friends = []
        }
    }

    private func scheduleSearch(for query: String) {
        guard hasLoadedInitialData else { return }

        searchTask?.cancel()
        searchTask = Task {
            if !query.isEmpty {
                try? await Task.sleep(for: .milliseconds(300))
            }
            guard !Task.isCancelled else { return }
            await loadAlbums(reset: true)
        }
    }

    private func loadAlbums(reset: Bool) async {
        guard let service else { return }
        guard reset || canLoadMoreAlbums else { return }
        guard reset || !isLoadingMore else { return }

        if reset {
            isLoading = true
            canLoadMoreAlbums = true
            nextAlbumOffset = 0
            visibleAlbumID = nil
        } else {
            isLoadingMore = true
        }

        defer {
            isLoading = false
            isLoadingMore = false
        }

        do {
            let page = try await service.fetchAlbums(
                query: searchText,
                friendID: activeFriendID,
                limit: albumPageSize,
                offset: reset ? 0 : nextAlbumOffset
            )
            let previousCount = albums.count
            if reset {
                albums = page
            } else {
                appendUniqueAlbums(page)
            }
            nextAlbumOffset = albums.count
            canLoadMoreAlbums = page.count == albumPageSize && (reset || albums.count > previousCount)
        } catch is CancellationError {
            return
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func loadMoreAlbumsIfNeeded(currentAlbum: Album) {
        guard canLoadMoreAlbums, !isLoading, !isLoadingMore else { return }
        guard albums.suffix(8).contains(currentAlbum) else { return }

        Task {
            await loadAlbums(reset: false)
        }
    }

    private func appendUniqueAlbums(_ newAlbums: [Album]) {
        var seenIDs = Set(albums.map(\.id))
        let uniqueNewAlbums = newAlbums.filter { album in
            seenIDs.insert(album.id).inserted
        }
        albums.append(contentsOf: uniqueNewAlbums)
    }
}

#Preview {
    AlbumsView()
        .environmentObject(AppState())
        .environmentObject(AudioPlayerService())
}
