import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            PlaylistsView()
                .tabItem {
                    Label("Playlists", systemImage: "music.note.list")
                }

            GenerateView()
                .tabItem {
                    Label("Generate", systemImage: "wand.and.stars")
                }

            DownloadsView()
                .tabItem {
                    Label("Downloads", systemImage: "arrow.down.circle")
                }

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape")
                }
        }
    }
}
