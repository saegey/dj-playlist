import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        NavigationStack {
            Form {
                Section("Server") {
                    Text(appState.serverURLString.isEmpty ? "Not configured" : appState.serverURLString)
                        .font(.footnote)

                    NavigationLink("Change Server") {
                        ServerSetupView()
                    }
                }

                Section("Mode") {
                    Text("Auth disabled (trusted network mode)")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Settings")
        }
    }
}
