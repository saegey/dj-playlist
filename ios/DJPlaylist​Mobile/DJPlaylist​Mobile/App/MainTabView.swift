import SwiftUI

struct MainTabView: View {
    @EnvironmentObject private var audioPlayer: AudioPlayerService

    var body: some View {
        TabView {
            PlaylistsView()
                .miniPlayerInset()
                .tabItem {
                    Label("Playlists", systemImage: "music.note.list")
                }

            AlbumsView()
                .miniPlayerInset()
                .tabItem {
                    Label("Albums", systemImage: "opticaldisc")
                }

            TracksView()
                .miniPlayerInset()
                .tabItem {
                    Label("Tracks", systemImage: "music.note")
                }

            SettingsView()
                .miniPlayerInset()
                .tabItem {
                    Label("Settings", systemImage: "gearshape")
                }
        }
    }
}
