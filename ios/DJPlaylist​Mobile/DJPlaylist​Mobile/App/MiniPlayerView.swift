import SwiftUI

private struct MiniPlayerInsetModifier: ViewModifier {
    @EnvironmentObject var audioPlayer: AudioPlayerService

    func body(content: Content) -> some View {
        content
            .safeAreaInset(edge: .bottom, spacing: 0) {
                if audioPlayer.currentTrack != nil {
                    MiniPlayerView()
                }
            }
    }
}

extension View {
    func miniPlayerInset() -> some View {
        modifier(MiniPlayerInsetModifier())
    }
}

struct MiniPlayerView: View {
    @EnvironmentObject private var audioPlayer: AudioPlayerService

    var body: some View {
        HStack(spacing: 12) {
            AsyncImage(url: audioPlayer.currentTrack?.albumArtURL) { image in
                image
                    .resizable()
                    .scaledToFill()
            } placeholder: {
                ZStack {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(.quaternary)
                    Image(systemName: "music.note")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(width: 40, height: 40)
            .clipShape(RoundedRectangle(cornerRadius: 6))

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
            if audioPlayer.totalDuration > 0 {
                GeometryReader { geo in
                    Rectangle()
                        .fill(.tint)
                        .frame(width: geo.size.width * min(audioPlayer.elapsedTime / audioPlayer.totalDuration, 1))
                }
                .frame(height: 2)
            }
        }
    }
}
