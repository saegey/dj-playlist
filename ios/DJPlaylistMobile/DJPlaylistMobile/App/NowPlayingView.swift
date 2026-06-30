import SwiftUI

struct NowPlayingView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var audioPlayer: AudioPlayerService
    @EnvironmentObject private var progress: PlaybackProgress
    @Environment(\.dismiss) private var dismiss
    @State private var showQueue = false
    @State private var queueNavigationPath = NavigationPath()
    @State private var isScrubbing = false
    @State private var scrubbedTime: Double = 0

    var body: some View {
        VStack(spacing: 0) {
            header
            Spacer()
            artwork
            Spacer()
            trackInfo
            progressBar
            controls
            bottomBar
        }
        .padding()
        .background(.background)
        .sheet(isPresented: $showQueue, onDismiss: { queueNavigationPath = NavigationPath() }) {
            queueSheet
        }
    }

    private var header: some View {
        ZStack {
            Text("Now Playing")
                .font(.subheadline)
                .fontWeight(.semibold)

            HStack {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "chevron.down")
                        .font(.title3)
                        .frame(width: 36, height: 36)
                }
                .buttonStyle(.plain)

                Spacer()

                HStack(spacing: 8) {
                    AirPlayRoutePickerView()
                        .frame(width: 36, height: 36)

                    Button {
                        showQueue = true
                    } label: {
                        Image(systemName: "list.bullet")
                            .font(.title3)
                            .frame(width: 36, height: 36)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var artwork: some View {
        AsyncImage(url: audioPlayer.currentTrack?.albumArtURL(relativeTo: appState.normalizedServerURL)) { image in
            image
                .resizable()
                .scaledToFill()
        } placeholder: {
            ZStack {
                RoundedRectangle(cornerRadius: 16)
                    .fill(.quaternary)
                Image(systemName: "music.note")
                    .font(.system(size: 60))
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: 320, maxHeight: 320)
        .aspectRatio(1, contentMode: .fit)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(radius: 12, y: 8)
    }

    private var trackInfo: some View {
        VStack(spacing: 4) {
            Text(audioPlayer.currentTrack?.displayTitle ?? "")
                .font(.title3)
                .fontWeight(.bold)
                .lineLimit(2)
                .multilineTextAlignment(.center)

            Text(audioPlayer.currentTrack?.displayArtist ?? "")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .lineLimit(1)

            if let albumName = audioPlayer.currentTrack?.albumName,
               !albumName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                Text(albumName)
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .lineLimit(1)
            }
        }
        .padding(.bottom, 16)
    }

    private var progressBar: some View {
        let displayElapsedTime = isScrubbing ? scrubbedTime : progress.elapsedTime

        return VStack(spacing: 4) {
            GeometryReader { geo in
                let duration = progress.totalDuration
                let progressFraction = playbackFraction(for: displayElapsedTime, duration: duration)

                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(.quaternary)
                        .frame(height: isScrubbing ? 6 : 4)

                    Capsule()
                        .fill(.tint)
                        .frame(width: geo.size.width * progressFraction, height: isScrubbing ? 6 : 4)

                    Circle()
                        .fill(.tint)
                        .frame(width: isScrubbing ? 18 : 12, height: isScrubbing ? 18 : 12)
                        .offset(x: max(0, (geo.size.width * progressFraction) - (isScrubbing ? 9 : 6)))
                        .opacity(duration > 0 ? 1 : 0)
                }
                .frame(height: 28)
                .contentShape(Rectangle())
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { value in
                            updateScrubbedTime(for: value.location.x, width: geo.size.width)
                        }
                        .onEnded { value in
                            updateScrubbedTime(for: value.location.x, width: geo.size.width)
                            audioPlayer.seek(to: scrubbedTime)
                            isScrubbing = false
                        }
                )
                .animation(.easeOut(duration: 0.12), value: isScrubbing)
            }
            .frame(height: 28)

            HStack {
                Text(formatTime(displayElapsedTime))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .monospacedDigit()

                Spacer()

                Text(formatTime(progress.totalDuration))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .monospacedDigit()
            }
        }
        .padding(.bottom, 16)
    }

    private var controls: some View {
        HStack(spacing: 40) {
            Button {
                audioPlayer.skipToPrevious()
            } label: {
                Image(systemName: "backward.fill")
                    .font(.title2)
                    .frame(width: 44, height: 44)
            }
            .buttonStyle(.plain)

            Button {
                if audioPlayer.isPlaying {
                    audioPlayer.pause()
                } else {
                    audioPlayer.resume()
                }
            } label: {
                Image(systemName: audioPlayer.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                    .font(.system(size: 56))
            }
            .buttonStyle(.plain)

            Button {
                audioPlayer.skipToNext()
            } label: {
                Image(systemName: "forward.fill")
                    .font(.title2)
                    .frame(width: 44, height: 44)
            }
            .buttonStyle(.plain)
            .foregroundStyle(audioPlayer.hasNext ? .primary : .quaternary)
            .disabled(!audioPlayer.hasNext)
        }
        .padding(.bottom, 24)
    }

    private var bottomBar: some View {
        HStack {
            if let bpm = audioPlayer.currentTrack?.bpm {
                Text("\(String(format: "%.0f", bpm)) BPM")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(.quaternary)
                    .clipShape(Capsule())
            }

            Spacer()

            if audioPlayer.queueTracks.count > 1 {
                Text("\(audioPlayer.currentQueueIndex + 1) of \(audioPlayer.queueTracks.count)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var queueSheet: some View {
        NavigationStack(path: $queueNavigationPath) {
            List {
                ForEach(Array(audioPlayer.queueTracks.enumerated()), id: \.element.id) { index, track in
                    HStack(spacing: 12) {
                        if index == audioPlayer.currentQueueIndex {
                            Image(systemName: "waveform")
                                .font(.caption)
                                .foregroundStyle(.tint)
                                .frame(width: 20)
                        } else {
                            Text("\(index + 1)")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                                .frame(width: 20)
                        }

                        AsyncImage(url: track.albumArtURL(relativeTo: appState.normalizedServerURL)) { image in
                            image.resizable().scaledToFill()
                        } placeholder: {
                            ZStack {
                                RoundedRectangle(cornerRadius: 6).fill(.quaternary)
                                Image(systemName: "music.note").font(.caption2).foregroundStyle(.secondary)
                            }
                        }
                        .frame(width: 40, height: 40)
                        .clipShape(RoundedRectangle(cornerRadius: 6))

                        VStack(alignment: .leading, spacing: 2) {
                            Text(track.displayTitle)
                                .font(.subheadline)
                                .fontWeight(index == audioPlayer.currentQueueIndex ? .semibold : .regular)
                                .lineLimit(1)

                            Text(track.displayArtist)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }

                        Spacer()

                        if let duration = track.displayDuration {
                            Text(duration)
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                        }
                    }
                    .listRowBackground(index == audioPlayer.currentQueueIndex ? Color.accentColor.opacity(0.08) : nil)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        audioPlayer.skipToIndex(index)
                    }
                    .contextMenu {
                        if index != audioPlayer.currentQueueIndex {
                            Button {
                                audioPlayer.skipToIndex(index)
                            } label: {
                                Label("Play Now", systemImage: "play.fill")
                            }
                        }

                        Button {
                            queueNavigationPath.append(track)
                        } label: {
                            Label("Go to Track", systemImage: "music.note")
                        }

                        if index > audioPlayer.currentQueueIndex {
                            Divider()
                            Button(role: .destructive) {
                                audioPlayer.removeFromQueue(at: index)
                            } label: {
                                Label("Remove from Queue", systemImage: "minus.circle")
                            }
                        }
                    }
                }
            }
            .navigationTitle("Queue")
            .navigationBarTitleDisplayMode(.inline)
            .navigationDestination(for: Track.self) { track in
                TrackDetailView(track: track)
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { showQueue = false }
                }
                ToolbarItem(placement: .destructiveAction) {
                    Button("Clear", role: .destructive) {
                        audioPlayer.stop()
                        showQueue = false
                    }
                }
            }
        }
    }

    private func playbackFraction(for elapsedTime: Double, duration: Double) -> Double {
        guard duration > 0, duration.isFinite else { return 0 }
        return min(max(elapsedTime / duration, 0), 1)
    }

    private func updateScrubbedTime(for xPosition: CGFloat, width: CGFloat) {
        guard progress.totalDuration > 0, width > 0 else { return }

        let fraction = min(max(xPosition / width, 0), 1)
        scrubbedTime = progress.totalDuration * fraction
        isScrubbing = true
    }

    private func formatTime(_ seconds: Double) -> String {
        guard seconds.isFinite, seconds >= 0 else { return "0:00" }
        let total = Int(seconds)
        let mins = total / 60
        let secs = total % 60
        return String(format: "%d:%02d", mins, secs)
    }
}
