import AVKit
import SwiftUI
import UIKit

private struct MiniPlayerSpacerModifier: ViewModifier {
    @EnvironmentObject var audioPlayer: AudioPlayerService

    func body(content: Content) -> some View {
        content
            .safeAreaInset(edge: .bottom, spacing: 0) {
                if audioPlayer.currentTrack != nil {
                    Color.clear.frame(height: 76)
                }
            }
    }
}

extension View {
    func miniPlayerSpacer() -> some View {
        modifier(MiniPlayerSpacerModifier())
    }
}

struct AirPlayRoutePickerView: UIViewRepresentable {
    func makeUIView(context: Context) -> AVRoutePickerView {
        let routePicker = AVRoutePickerView()
        routePicker.prioritizesVideoDevices = false
        routePicker.tintColor = .label
        routePicker.activeTintColor = .systemBlue
        return routePicker
    }

    func updateUIView(_ uiView: AVRoutePickerView, context: Context) {}
}

struct MiniPlayerView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var audioPlayer: AudioPlayerService
    @EnvironmentObject private var progress: PlaybackProgress
    @State private var showNowPlaying = false
    @State private var artworkImage: UIImage?

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                HStack(spacing: 12) {
                    Group {
                        if let artworkImage {
                            Image(uiImage: artworkImage)
                                .resizable()
                                .scaledToFill()
                        } else {
                            ZStack {
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(.quaternary)
                                Image(systemName: "music.note")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .frame(width: 42, height: 42)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .task(id: audioPlayer.currentTrack?.id) {
                        artworkImage = nil
                        guard let url = audioPlayer.currentTrack?.albumArtURL(relativeTo: appState.normalizedServerURL) else { return }
                        do {
                            let (data, _) = try await URLSession.shared.data(from: url)
                            if !Task.isCancelled {
                                artworkImage = UIImage(data: data)
                            }
                        } catch {}
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(audioPlayer.currentTrack?.displayTitle ?? "")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .lineLimit(1)

                        Text(audioPlayer.currentTrack?.displayArtist ?? "")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }

                    Spacer(minLength: 0)
                }
                .contentShape(Rectangle())
                .onTapGesture {
                    showNowPlaying = true
                }

                AirPlayRoutePickerView()
                    .frame(width: 36, height: 36)

                Button {
                    if audioPlayer.isPlaying {
                        audioPlayer.pause()
                    } else {
                        audioPlayer.resume()
                    }
                } label: {
                    Image(systemName: audioPlayer.isPlaying ? "pause.fill" : "play.fill")
                        .font(.title2)
                        .frame(width: 36, height: 36)
                }
                .buttonStyle(.plain)

                if audioPlayer.hasNext {
                    Button {
                        audioPlayer.skipToNext()
                    } label: {
                        Image(systemName: "forward.fill")
                            .font(.subheadline)
                            .frame(width: 36, height: 36)
                    }
                    .buttonStyle(.plain)
                }

                Button {
                    audioPlayer.stop()
                } label: {
                    Image(systemName: "xmark")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .frame(width: 28, height: 28)
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)

            if progress.totalDuration > 0 {
                GeometryReader { geo in
                    Rectangle()
                        .fill(.tint)
                        .frame(width: geo.size.width * min(progress.elapsedTime / progress.totalDuration, 1))
                }
                .frame(height: 2)
            }
        }
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.18), radius: 12, x: 0, y: 4)
        .padding(.horizontal, 12)
        .fullScreenCover(isPresented: $showNowPlaying) {
            NowPlayingView()
                .environmentObject(audioPlayer)
                .environmentObject(progress)
        }
    }
}
