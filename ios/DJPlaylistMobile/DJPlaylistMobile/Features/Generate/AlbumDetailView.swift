import SwiftUI

struct AlbumDetailView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var audioPlayer: AudioPlayerService
    let album: Album
    @State private var detailAlbum: Album?
    @State private var tracks: [Track] = []
    @State private var isLoading = false
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
    @State private var showEditAlbum = false
    @State private var editLibraryIdentifier = ""
    @State private var editAlbumNotes = ""
    @State private var editPurchasePrice = ""
    @State private var editCondition = ""
    @State private var isSavingAlbum = false
    @State private var editAlbumError: String?
    @State private var showLogSpinSheet = false
    @State private var playableStructure: AlbumPlayableStructureResponse?
    @State private var recentSpins: [SpinListItem] = []
    @State private var isLoadingSpins = false
    @State private var spinError: String?
    @State private var spinMode: SpinLoggingMode = .sides
    @State private var selectedSideKeys: Set<String> = []
    @State private var selectedTrackIDs: Set<String> = []
    @State private var spinPlayedAt = Date()
    @State private var spinContextType = ""
    @State private var spinNote = ""
    @State private var isSavingSpin = false
    @State private var spinSaveFeedbackToken = 0

    private var displayAlbum: Album { detailAlbum ?? album }
    private var currentReleaseID: String? { displayAlbum.releaseID ?? album.releaseID }
    private var currentFriendID: Int? { displayAlbum.friendID ?? album.friendID }
    private static let spinRequestDateFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()
    private static let spinResponseDateFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()
    private static let spinResponseFallbackDateFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    var body: some View {
        Group {
            if isLoading && tracks.isEmpty {
                ProgressView("Loading album...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let errorMessage {
                ContentUnavailableView(
                    "Error",
                    systemImage: "exclamationmark.triangle",
                    description: Text(errorMessage)
                )
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        albumHeader
                        trackList
                    }
                }
            }
        }
        .navigationTitle(displayAlbum.displayName)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button("Edit Album", systemImage: "pencil") {
                        prepareAlbumEdit()
                        showEditAlbum = true
                    }

                    Button("Log Spin", systemImage: "opticaldisc") {
                        prepareSpinLogging()
                        showLogSpinSheet = true
                    }
                    .disabled(currentReleaseID == nil || currentFriendID == nil)

                    if !tracks.isEmpty {
                        Button("Play", systemImage: "play.fill") {
                            playAlbum()
                        }
                        .disabled(!tracks.contains(where: \.isPlayable))
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .task {
            await loadDetail()
        }
        .onChange(of: audioPlayer.errorMessage) { _, newValue in
            if let newValue {
                errorMessage = newValue
            }
        }
        .alert("Error", isPresented: .constant(errorMessage != nil)) {
            Button("OK") { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "")
        }
        .sheet(isPresented: $showSimilarVibes) {
            similarVibesSheet
        }
        .sheet(isPresented: $showAddToPlaylist) {
            addToPlaylistSheet
        }
        .sheet(isPresented: $showEditAlbum) {
            editAlbumSheet
        }
        .sheet(isPresented: $showLogSpinSheet) {
            logSpinSheet
        }
        .sensoryFeedback(.success, trigger: spinSaveFeedbackToken)
        .miniPlayerSpacer()
    }

    private var albumHeader: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 16) {
                AsyncImage(url: displayAlbum.coverArtURL(relativeTo: appState.normalizedServerURL)) { image in
                    image
                        .resizable()
                        .scaledToFill()
                } placeholder: {
                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(.quaternary)
                        Image(systemName: "opticaldisc.fill")
                            .font(.largeTitle)
                            .foregroundStyle(.secondary)
                    }
                }
                .frame(width: 140, height: 140)
                .clipShape(RoundedRectangle(cornerRadius: 12))

                VStack(alignment: .leading, spacing: 6) {
                    if let identifier = displayAlbum.physicalIdentifier?.nonEmpty {
                        Text(identifier)
                            .font(.caption)
                            .fontWeight(.bold)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(.blue)
                            .foregroundStyle(.white)
                            .clipShape(Capsule())
                    }

                    Text(displayAlbum.displayName)
                        .font(.title3)
                        .fontWeight(.bold)
                        .lineLimit(3)

                    Text(displayAlbum.displayArtist)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    if let year = displayAlbum.year {
                        Text(year)
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }
            }

            if displayAlbum.label != nil || displayAlbum.format != nil {
                HStack(spacing: 8) {
                    if let label = displayAlbum.label {
                        Text(label)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    if let format = displayAlbum.format {
                        Text(format)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            if displayAlbum.condition?.nonEmpty != nil || displayAlbum.purchasePrice != nil {
                HStack(spacing: 8) {
                    if let condition = displayAlbum.condition?.nonEmpty {
                        Text(condition)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    if let purchasePrice = displayAlbum.purchasePrice {
                        Text(formatPurchasePrice(purchasePrice))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            if let notes = displayAlbum.albumNotes?.nonEmpty {
                Text(notes)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(4)
            }

            if let genres = displayAlbum.genres, !genres.isEmpty {
                FlowLayout(spacing: 4) {
                    ForEach(genres, id: \.self) { genre in
                        Text(genre)
                            .font(.caption2)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(.blue.opacity(0.15))
                            .foregroundStyle(.blue)
                            .clipShape(Capsule())
                    }
                    if let styles = displayAlbum.styles {
                        ForEach(styles, id: \.self) { style in
                            Text(style)
                                .font(.caption2)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(.purple.opacity(0.15))
                                .foregroundStyle(.purple)
                                .clipShape(Capsule())
                        }
                    }
                }
            }
        }
        .padding()
    }

    private var trackList: some View {
        LazyVStack(alignment: .leading, spacing: 0) {
            if tracks.isEmpty {
                Text("No tracks found.")
                    .foregroundStyle(.secondary)
                    .padding()
            } else {
                Text("\(tracks.count) tracks")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .padding(.horizontal)
                    .padding(.bottom, 8)

                ForEach(tracks) { track in
                    NavigationLink {
                        TrackDetailView(track: track)
                            .environmentObject(appState)
                            .environmentObject(audioPlayer)
                    } label: {
                        HStack(alignment: .center, spacing: 12) {
                            if let position = track.displayPosition {
                                Text(position)
                                    .font(.caption)
                                    .foregroundStyle(.tertiary)
                                    .frame(width: 28, alignment: .trailing)
                            }

                            VStack(alignment: .leading, spacing: 2) {
                                Text(track.displayTitle)
                                    .font(.body)
                                    .lineLimit(2)

                                if let artist = track.artist, artist != displayAlbum.artist {
                                    Text(artist)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }

                            Spacer(minLength: 0)

                            if let duration = track.displayDuration {
                                Text(duration)
                                    .font(.caption)
                                    .foregroundStyle(.tertiary)
                            }
                        }
                        .padding(.horizontal)
                        .padding(.vertical, 10)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
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
                    }

                    if track.id != tracks.last?.id {
                        Divider()
                            .padding(.leading, 40)
                    }
                }
            }
        }
    }

    private var service: PlaylistService? {
        guard let url = appState.normalizedServerURL else { return nil }
        return PlaylistService(client: APIClient(serverURL: url))
    }

    private func loadDetail() async {
        guard let service,
              let releaseID = album.releaseID,
              let friendID = album.friendID else {
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            let response = try await service.fetchAlbumDetail(releaseID: releaseID, friendID: friendID)
            detailAlbum = response.album
            tracks = response.tracks
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func togglePlayback(for track: Track) {
        guard let serverURL = appState.normalizedServerURL else { return }
        Task {
            do {
                try await audioPlayer.togglePlayback(for: track, serverURL: serverURL)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func playAlbum() {
        let playableTracks = tracks.filter(\.isPlayable)
        guard let serverURL = appState.normalizedServerURL, !playableTracks.isEmpty else { return }
        Task {
            do {
                try await audioPlayer.playQueuedPlaylist(playableTracks, serverURL: serverURL)
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
                            image.resizable().scaledToFill()
                        } placeholder: {
                            ZStack {
                                RoundedRectangle(cornerRadius: 10).fill(.quaternary)
                                Image(systemName: "music.note").foregroundStyle(.secondary)
                            }
                        }
                        .frame(width: 48, height: 48)
                        .clipShape(RoundedRectangle(cornerRadius: 10))

                        VStack(alignment: .leading, spacing: 4) {
                            Text(similarTrack.displayTitle).font(.headline).lineLimit(2)
                            Text(similarTrack.displayArtist).font(.subheadline).foregroundStyle(.secondary).lineLimit(1)
                            if let bpm = similarTrack.bpm {
                                Text("\(String(format: "%.0f", bpm)) BPM").font(.caption).foregroundStyle(.tertiary)
                            }
                        }
                    }
                }
            }
            .overlay {
                if isLoadingSimilar {
                    ProgressView("Finding similar vibes...")
                } else if let similarError {
                    ContentUnavailableView("Error", systemImage: "exclamationmark.triangle", description: Text(similarError))
                } else if similarTracks.isEmpty {
                    ContentUnavailableView("No Similar Tracks", systemImage: "waveform.path", description: Text("No tracks with similar vibes were found."))
                }
            }
            .navigationTitle("Similar Vibes")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { showSimilarVibes = false }
                }
            }
            .task { await loadSimilarTracks() }
        }
    }

    private func loadSimilarTracks() async {
        guard let service, let track = similarVibesTrack, let friendID = track.friendID else { return }
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

    private var logSpinSheet: some View {
        NavigationStack {
            Form {
                if let spinError {
                    Section {
                        Text(spinError)
                            .foregroundStyle(.red)
                    }
                }

                Section("Spin Details") {
                    DatePicker("Played At", selection: $spinPlayedAt)
                    TextField("Context", text: $spinContextType)
                        .textInputAutocapitalization(.never)
                    TextEditor(text: $spinNote)
                        .frame(minHeight: 100)
                }

                Section("Selection Mode") {
                    Picker("Mode", selection: $spinMode) {
                        ForEach(SpinLoggingMode.allCases) { mode in
                            Text(mode.title).tag(mode)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                if let playableStructure {
                    if spinMode == .sides {
                        Section("Sides") {
                            if playableStructure.sides.isEmpty {
                                Text("No normalized sides were returned for this album.")
                                    .foregroundStyle(.secondary)
                            } else {
                                ForEach(playableStructure.sides) { side in
                                    Button {
                                        toggleSideSelection(side.sideKey)
                                    } label: {
                                        HStack {
                                            VStack(alignment: .leading, spacing: 4) {
                                                Text(side.displayLabel)
                                                    .foregroundStyle(.primary)
                                                Text("\(side.trackCount ?? side.tracks.count) tracks")
                                                    .font(.caption)
                                                    .foregroundStyle(.secondary)
                                            }
                                            Spacer()
                                            Image(systemName: selectedSideKeys.contains(side.sideKey) ? "checkmark.circle.fill" : "circle")
                                                .foregroundStyle(selectedSideKeys.contains(side.sideKey) ? Color.accentColor : Color.secondary)
                                        }
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    } else {
                        Section("Tracks") {
                            if playableStructure.tracks.isEmpty {
                                Text("No playable tracks were returned for this album.")
                                    .foregroundStyle(.secondary)
                            } else {
                                ForEach(playableStructure.tracks) { track in
                                    Button {
                                        toggleTrackSelection(track.trackID)
                                    } label: {
                                        HStack(alignment: .center, spacing: 12) {
                                            if let position = track.position?.nonEmpty {
                                                Text(position)
                                                    .font(.caption)
                                                    .foregroundStyle(.tertiary)
                                                    .frame(width: 28, alignment: .trailing)
                                            }

                                            VStack(alignment: .leading, spacing: 2) {
                                                Text(track.displayTitle)
                                                    .foregroundStyle(.primary)
                                                if let artist = track.displayArtist,
                                                   artist != displayAlbum.displayArtist {
                                                    Text(artist)
                                                        .font(.caption)
                                                        .foregroundStyle(.secondary)
                                                }
                                            }

                                            Spacer()

                                            Image(systemName: selectedTrackIDs.contains(track.trackID) ? "checkmark.circle.fill" : "circle")
                                                .foregroundStyle(selectedTrackIDs.contains(track.trackID) ? Color.accentColor : Color.secondary)
                                        }
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }
                } else if isLoadingSpins {
                    Section {
                        ProgressView("Loading spin data...")
                    }
                }

                Section("Recent Spins") {
                    if isLoadingSpins && recentSpins.isEmpty {
                        ProgressView("Loading recent spins...")
                    } else if recentSpins.isEmpty {
                        Text("No recent spins logged for this album.")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(recentSpins.prefix(5)) { spin in
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text(formattedSpinPlayedAt(spin.playedAt))
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                    Spacer()
                                    if let context = spin.contextType?.nonEmpty {
                                        Text(context)
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                }

                                Text(spinSelectionSummary(spin))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)

                                if let note = spin.note?.nonEmpty {
                                    Text(note)
                                        .font(.caption)
                                        .foregroundStyle(.tertiary)
                                        .lineLimit(3)
                                }
                            }
                            .padding(.vertical, 2)
                        }
                    }
                }
            }
            .disabled(isSavingSpin)
            .navigationTitle("Log Spin")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showLogSpinSheet = false }
                        .disabled(isSavingSpin)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task { await saveSpin() }
                    }
                    .disabled(isSavingSpin || !hasValidSpinSelection)
                }
            }
            .overlay {
                if isSavingSpin {
                    ProgressView("Saving spin...")
                }
            }
            .task {
                await loadSpinSheetDataIfNeeded(force: false)
            }
        }
    }

    private var editAlbumSheet: some View {
        NavigationStack {
            Form {
                Section("Catalog") {
                    TextField("Library identifier", text: $editLibraryIdentifier)
                    TextField("Condition", text: $editCondition)
                    TextField("Purchase price", text: $editPurchasePrice)
                        .keyboardType(.decimalPad)
                }

                Section("Notes") {
                    TextEditor(text: $editAlbumNotes)
                        .frame(minHeight: 120)
                }

                if let editAlbumError {
                    Section {
                        Text(editAlbumError)
                            .foregroundStyle(.red)
                    }
                }
            }
            .disabled(isSavingAlbum)
            .navigationTitle("Edit Album")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showEditAlbum = false }
                        .disabled(isSavingAlbum)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task { await saveAlbumEdits() }
                    }
                    .disabled(isSavingAlbum || displayAlbum.releaseID == nil || displayAlbum.friendID == nil)
                }
            }
            .overlay {
                if isSavingAlbum {
                    ProgressView("Saving...")
                }
            }
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
                            Text(playlist.name).foregroundStyle(.primary)
                            if let count = playlist.tracks?.count {
                                Text("\(count) tracks").font(.caption).foregroundStyle(.secondary)
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
                    ContentUnavailableView("Error", systemImage: "exclamationmark.triangle", description: Text(addToPlaylistError))
                } else if allPlaylists.isEmpty {
                    ContentUnavailableView("No Playlists", systemImage: "music.note.list", description: Text("Create a playlist first."))
                }
            }
            .navigationTitle("Add to Playlist")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { showAddToPlaylist = false }
                }
            }
            .task { await loadAllPlaylists() }
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
        guard let service, let track = addToPlaylistTrack, let friendID = track.friendID else { return }
        do {
            try await service.addTrackToPlaylist(playlistID: playlist.id, trackID: track.trackID, friendID: friendID)
            showAddToPlaylist = false
        } catch {
            addToPlaylistError = error.localizedDescription
        }
    }

    private func prepareAlbumEdit() {
        editLibraryIdentifier = displayAlbum.physicalIdentifier ?? ""
        editAlbumNotes = displayAlbum.albumNotes ?? ""
        editPurchasePrice = displayAlbum.purchasePrice.map(formatEditableNumber) ?? ""
        editCondition = displayAlbum.condition ?? ""
        editAlbumError = nil
    }

    private func saveAlbumEdits() async {
        guard let service,
              let releaseID = displayAlbum.releaseID,
              let friendID = displayAlbum.friendID else {
            editAlbumError = "Album identifiers are missing."
            return
        }

        let trimmedPrice = editPurchasePrice.trimmingCharacters(in: .whitespacesAndNewlines)
        let purchasePrice: Double
        if trimmedPrice.isEmpty {
            purchasePrice = 0
        } else if let parsedPrice = Double(trimmedPrice) {
            purchasePrice = parsedPrice
        } else {
            editAlbumError = "Purchase price must be a number."
            return
        }

        isSavingAlbum = true
        editAlbumError = nil
        defer { isSavingAlbum = false }

        do {
            try await service.updateAlbum(
                releaseID: releaseID,
                friendID: friendID,
                albumRating: displayAlbum.albumRating ?? 0,
                albumNotes: editAlbumNotes.trimmingCharacters(in: .whitespacesAndNewlines),
                purchasePrice: purchasePrice,
                condition: editCondition.trimmingCharacters(in: .whitespacesAndNewlines),
                libraryIdentifier: editLibraryIdentifier.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            showEditAlbum = false
            await loadDetail()
        } catch is CancellationError {
            return
        } catch {
            editAlbumError = error.localizedDescription
        }
    }

    private func prepareSpinLogging() {
        spinMode = .sides
        spinPlayedAt = Date()
        spinContextType = ""
        spinNote = ""
        selectedSideKeys = []
        selectedTrackIDs = []
        spinError = nil
    }

    private func loadSpinSheetDataIfNeeded(force: Bool) async {
        guard let service,
              let releaseID = currentReleaseID,
              let friendID = currentFriendID else {
            spinError = "Album identifiers are missing."
            return
        }

        if !force, playableStructure != nil, !recentSpins.isEmpty {
            return
        }

        isLoadingSpins = true
        spinError = nil
        defer { isLoadingSpins = false }

        do {
            async let structure = service.fetchAlbumPlayableStructure(releaseID: releaseID, friendID: friendID)
            async let spins = service.fetchSpins(friendID: friendID, releaseID: releaseID, limit: 20, offset: 0)
            playableStructure = try await structure
            recentSpins = try await spins
        } catch is CancellationError {
            return
        } catch {
            spinError = error.localizedDescription
        }
    }

    private var hasValidSpinSelection: Bool {
        switch spinMode {
        case .sides:
            return !selectedSideKeys.isEmpty
        case .tracks:
            return !selectedTrackIDs.isEmpty
        }
    }

    private func toggleSideSelection(_ sideKey: String) {
        if selectedSideKeys.contains(sideKey) {
            selectedSideKeys.remove(sideKey)
        } else {
            selectedSideKeys.insert(sideKey)
        }
    }

    private func toggleTrackSelection(_ trackID: String) {
        if selectedTrackIDs.contains(trackID) {
            selectedTrackIDs.remove(trackID)
        } else {
            selectedTrackIDs.insert(trackID)
        }
    }

    private func saveSpin() async {
        guard let service,
              let releaseID = currentReleaseID,
              let friendID = currentFriendID else {
            spinError = "Album identifiers are missing."
            return
        }

        guard hasValidSpinSelection else {
            spinError = "Select at least one side or track."
            return
        }

        let trimmedContext = spinContextType.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedNote = spinNote.trimmingCharacters(in: .whitespacesAndNewlines)
        let request = SpinCreateRequest(
            friend_id: friendID,
            release_id: releaseID,
            played_at: Self.spinRequestDateFormatter.string(from: spinPlayedAt),
            note: trimmedNote.isEmpty ? nil : trimmedNote,
            context_type: trimmedContext.isEmpty ? nil : trimmedContext,
            side_keys: spinMode == .sides ? Array(selectedSideKeys).sorted() : nil,
            track_refs: spinMode == .tracks ? selectedTrackRefs(friendID: friendID) : nil
        )

        isSavingSpin = true
        spinError = nil
        defer { isSavingSpin = false }

        do {
            _ = try await service.createSpin(request: request)
            spinSaveFeedbackToken += 1
            showLogSpinSheet = false
            await loadSpinSheetDataIfNeeded(force: true)
        } catch is CancellationError {
            return
        } catch {
            spinError = error.localizedDescription
        }
    }

    private func selectedTrackRefs(friendID: Int) -> [PlaylistTrackRef] {
        let sourceTracks = playableStructure?.tracks ?? []
        return sourceTracks
            .filter { selectedTrackIDs.contains($0.trackID) }
            .map { PlaylistTrackRef(track_id: $0.trackID, friend_id: $0.friendID ?? friendID) }
    }

    private func spinSelectionSummary(_ spin: SpinListItem) -> String {
        let sideKeys = spin.selection?.sideKeys ?? spin.derived?.sideKeys ?? []
        if !sideKeys.isEmpty {
            return "Sides: " + sideKeys.joined(separator: ", ")
        }

        let trackCount = spin.selection?.trackRefs.count ?? spin.trackEvents.count
        if trackCount > 0 {
            return "\(trackCount) tracks logged"
        }

        if let sideCount = spin.derived?.sideCount, sideCount > 0 {
            return "\(sideCount) sides logged"
        }

        return "Spin logged"
    }

    private func formattedSpinPlayedAt(_ rawValue: String?) -> String {
        guard let rawValue,
              let date = Self.spinResponseDateFormatter.date(from: rawValue)
            ?? Self.spinResponseFallbackDateFormatter.date(from: rawValue) else {
            return rawValue?.nonEmpty ?? "Unknown time"
        }
        return date.formatted(date: .abbreviated, time: .shortened)
    }

    private func formatPurchasePrice(_ value: Double) -> String {
        "$" + formatEditableNumber(value)
    }

    private func formatEditableNumber(_ value: Double) -> String {
        if value.rounded() == value {
            return String(format: "%.0f", value)
        }
        return String(format: "%.2f", value)
    }
}

private enum SpinLoggingMode: String, CaseIterable, Identifiable {
    case sides
    case tracks

    var id: String { rawValue }

    var title: String {
        switch self {
        case .sides:
            return "Sides"
        case .tracks:
            return "Tracks"
        }
    }
}

private extension String {
    var nonEmpty: String? {
        let trimmed = trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 4

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let rows = computeRows(proposal: proposal, subviews: subviews)
        var height: CGFloat = 0
        for (index, row) in rows.enumerated() {
            let rowHeight = row.map { $0.sizeThatFits(.unspecified).height }.max() ?? 0
            height += rowHeight
            if index < rows.count - 1 { height += spacing }
        }
        return CGSize(width: proposal.width ?? 0, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let rows = computeRows(proposal: proposal, subviews: subviews)
        var y = bounds.minY
        for row in rows {
            let rowHeight = row.map { $0.sizeThatFits(.unspecified).height }.max() ?? 0
            var x = bounds.minX
            for subview in row {
                let size = subview.sizeThatFits(.unspecified)
                subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
                x += size.width + spacing
            }
            y += rowHeight + spacing
        }
    }

    private func computeRows(proposal: ProposedViewSize, subviews: Subviews) -> [[LayoutSubviews.Element]] {
        let maxWidth = proposal.width ?? .infinity
        var rows: [[LayoutSubviews.Element]] = [[]]
        var currentWidth: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if currentWidth + size.width > maxWidth && !rows[rows.count - 1].isEmpty {
                rows.append([])
                currentWidth = 0
            }
            rows[rows.count - 1].append(subview)
            currentWidth += size.width + spacing
        }
        return rows
    }
}
