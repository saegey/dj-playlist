import AVKit
import SwiftUI
import UIKit

private struct MiniPlayerSpacerModifier: ViewModifier {
    @EnvironmentObject var audioPlayer: AudioPlayerService

    func body(content: Content) -> some View {
        content
            .safeAreaInset(edge: .bottom, spacing: 0) {
                if audioPlayer.currentTrack != nil {
                    Color.clear.frame(height: 56)
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
    @EnvironmentObject private var audioPlayer: AudioPlayerService
    @EnvironmentObject private var progress: PlaybackProgress
    @State private var showNowPlaying = false
    @State private var artworkImage: UIImage?

    var body: some View {
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
                .frame(width: 40, height: 40)
                .clipShape(RoundedRectangle(cornerRadius: 6))
                .task(id: audioPlayer.currentTrack?.id) {
                    artworkImage = nil
                    guard let url = audioPlayer.currentTrack?.albumArtURL else { return }
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
                        .fontWeight(.medium)
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
                    .font(.title3)
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
                    .font(.subheadline)
                    .frame(width: 28, height: 28)
                    .foregroundStyle(.secondary)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(.ultraThinMaterial)
        .overlay(alignment: .bottom) {
            if progress.totalDuration > 0 {
                GeometryReader { geo in
                    Rectangle()
                        .fill(.tint)
                        .frame(width: geo.size.width * min(progress.elapsedTime / progress.totalDuration, 1))
                }
                .frame(height: 2)
            }
        }
        .fullScreenCover(isPresented: $showNowPlaying) {
            NowPlayingView()
                .environmentObject(audioPlayer)
                .environmentObject(progress)
        }
    }
}
