import SwiftUI

@main
struct DJPlaylistMobileApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var audioPlayer = AudioPlayerService()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .environmentObject(audioPlayer)
        }
    }
}
