import SwiftUI

struct AlbumDetailView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var audioPlayer: AudioPlayerService
    let album: Album
    @State private var detailAlbum: Album?
    @State private var tracks: [Track] = []
    @State private var isLoading = false
    @State private var errorMessage: String?

    private var displayAlbum: Album { detailAlbum ?? album }

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
                if !tracks.isEmpty {
                    Button("Play", systemImage: "play.fill") {
                        playAlbum()
                    }
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
    }

    private var albumHeader: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 16) {
                AsyncImage(url: displayAlbum.coverArtURL) { image in
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

                        Button {
                            togglePlayback(for: track)
                        } label: {
                            Image(systemName: playbackIconName(for: track))
                                .font(.title3)
                                .frame(width: 32, height: 32)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 10)

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
        guard let serverURL = appState.normalizedServerURL, !tracks.isEmpty else { return }
        Task {
            do {
                try await audioPlayer.playQueuedPlaylist(tracks, serverURL: serverURL)
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
