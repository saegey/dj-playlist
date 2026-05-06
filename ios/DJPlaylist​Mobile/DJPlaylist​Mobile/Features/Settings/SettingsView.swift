import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var appState: AppState
    @State private var friends: [Friend] = []
    @State private var isLoadingFriends = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack {
                        Spacer()
                        Image("AppLogo")
                            .resizable()
                            .scaledToFit()
                            .frame(height: 120)
                        Spacer()
                    }
                    .listRowBackground(Color.clear)
                }

                Section("Server") {
                    Text(appState.serverURLString.isEmpty ? "Not configured" : appState.serverURLString)
                        .font(.footnote)

                    NavigationLink("Change Server") {
                        ServerSetupView()
                    }
                }

                Section {
                    Picker("Default Library", selection: $appState.defaultFriendID) {
                        Text("All Libraries")
                            .tag(nil as Int?)
                        ForEach(friends) { friend in
                            Text(friend.username)
                                .tag(friend.id as Int?)
                        }
                    }
                } header: {
                    Text("Library")
                } footer: {
                    Text("Albums and tracks will be filtered to this library by default.")
                }

                Section("Mode") {
                    Text("Auth disabled (trusted network mode)")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Settings")
            .task {
                await loadFriends()
            }
        }
    }

    private func loadFriends() async {
        guard let url = appState.normalizedServerURL else { return }
        let service = PlaylistService(client: APIClient(serverURL: url))
        isLoadingFriends = true
        defer { isLoadingFriends = false }
        do {
            friends = try await service.fetchFriends()
        } catch {
            friends = []
        }
    }
}
