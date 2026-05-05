import Foundation

@MainActor
final class AppState: ObservableObject {
    @Published var serverURLString: String {
        didSet {
            UserDefaults.standard.set(serverURLString, forKey: Self.serverURLKey)
        }
    }

    static let serverURLKey = "mobile.serverURL"

    init() {
        serverURLString = UserDefaults.standard.string(forKey: Self.serverURLKey) ?? ""
    }

    var hasValidServerURL: Bool {
        normalizedServerURL != nil
    }

    var normalizedServerURL: URL? {
        Self.normalizeServerURL(serverURLString)
    }

    func updateServerURL(_ newValue: String) {
        serverURLString = newValue
    }

    static func normalizeServerURL(_ raw: String) -> URL? {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }

        let candidate: String
        if trimmed.hasPrefix("http://") || trimmed.hasPrefix("https://") {
            candidate = trimmed
        } else {
            candidate = "http://\(trimmed)"
        }

        guard let url = URL(string: candidate) else { return nil }
        guard let scheme = url.scheme?.lowercased(), scheme == "http" || scheme == "https" else {
            return nil
        }
        guard url.host != nil else { return nil }

        return url
    }
}
