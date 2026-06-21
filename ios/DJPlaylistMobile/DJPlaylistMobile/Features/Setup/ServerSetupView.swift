import SwiftUI

struct ServerSetupView: View {
    @EnvironmentObject private var appState: AppState
    @State private var urlText: String = ""
    @State private var isTesting = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Server") {
                    TextField("http://100.x.x.x:3000", text: $urlText)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)

                    if urlText.lowercased().hasPrefix("http://") {
                        Text("Warning: Using plain HTTP. Recommended only on trusted networks like Tailscale.")
                            .font(.footnote)
                            .foregroundStyle(.orange)
                    }
                }

                Section {
                    Button(isTesting ? "Testing..." : "Test Connection") {
                        Task { await testAndSave() }
                    }
                    .disabled(isTesting)
                }
            }
            .navigationTitle("Server Setup")
            .onAppear {
                urlText = appState.serverURLString
            }
            .alert("Connection Failed", isPresented: errorIsPresented) {
                Button("OK") { errorMessage = nil }
            } message: {
                Text(errorMessage ?? "Unknown error")
            }
        }
    }

    private var errorIsPresented: Binding<Bool> {
        Binding(
            get: { errorMessage != nil },
            set: { isPresented in
                if !isPresented {
                    errorMessage = nil
                }
            }
        )
    }

    private func testAndSave() async {
        errorMessage = nil
        isTesting = true
        defer { isTesting = false }

        guard let url = AppState.normalizeServerURL(urlText) else {
            errorMessage = "Enter a valid URL with host and optional port."
            return
        }

        do {
            let service = PlaylistService(client: APIClient(serverURL: url))
            try await service.testConnection()
            appState.updateServerURL(url.absoluteString)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
