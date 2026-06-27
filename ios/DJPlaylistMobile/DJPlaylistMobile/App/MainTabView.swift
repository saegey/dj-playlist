import SwiftUI
import UIKit

private struct TabBarHeightReader: UIViewControllerRepresentable {
    @Binding var height: CGFloat

    func makeUIViewController(context: Context) -> UIViewController {
        TabBarHeightReaderController(height: $height)
    }

    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}

    private final class TabBarHeightReaderController: UIViewController {
        @Binding private var height: CGFloat

        init(height: Binding<CGFloat>) {
            _height = height
            super.init(nibName: nil, bundle: nil)
        }

        @available(*, unavailable)
        required init?(coder: NSCoder) {
            fatalError("init(coder:) has not been implemented")
        }

        override func viewDidLayoutSubviews() {
            super.viewDidLayoutSubviews()

            guard let tabBarHeight = tabBarController?.tabBar.frame.height,
                  tabBarHeight > 0,
                  abs(height - tabBarHeight) > 0.5 else {
                return
            }

            DispatchQueue.main.async {
                self.height = tabBarHeight
            }
        }
    }
}

struct MainTabView: View {
    @EnvironmentObject private var audioPlayer: AudioPlayerService
    @State private var tabBarHeight: CGFloat = 49

    var body: some View {
        TabView {
            PlaylistsView()
                .tabItem {
                    Label("Playlists", systemImage: "music.note.list")
                }

            AlbumsView()
                .tabItem {
                    Label("Albums", systemImage: "opticaldisc")
                }

            TracksView()
                .tabItem {
                    Label("Tracks", systemImage: "music.note")
                }

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape")
                }
        }
        .background(TabBarHeightReader(height: $tabBarHeight).frame(width: 0, height: 0))
        .overlay(alignment: .bottom) {
            if audioPlayer.currentTrack != nil {
                MiniPlayerView()
                    .padding(.bottom, tabBarHeight + 8)
                    .ignoresSafeArea(.keyboard, edges: .bottom)
            }
        }
        .ignoresSafeArea(.keyboard, edges: .bottom)
    }
}
