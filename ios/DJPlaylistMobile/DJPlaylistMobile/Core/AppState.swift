import Combine
import Foundation

@MainActor
final class AppState: ObservableObject {
    @Published var serverURLString: String {
        didSet {
            UserDefaults.standard.set(serverURLString, forKey: Self.serverURLKey)
        }
    }

    @Published var defaultFriendID: Int? {
        didSet {
            if let defaultFriendID {
                UserDefaults.standard.set(defaultFriendID, forKey: Self.defaultFriendIDKey)
            } else {
                UserDefaults.standard.removeObject(forKey: Self.defaultFriendIDKey)
            }
        }
    }

    @Published var autoplayEnabled: Bool {
        didSet {
            UserDefaults.standard.set(autoplayEnabled, forKey: Self.autoplayEnabledKey)
        }
    }

    static let serverURLKey = "mobile.serverURL"
    static let defaultFriendIDKey = "mobile.defaultFriendID"
    static let autoplayEnabledKey = "mobile.autoplayEnabled"

    init() {
        serverURLString = UserDefaults.standard.string(forKey: Self.serverURLKey) ?? ""
        let storedFriendID = UserDefaults.standard.integer(forKey: Self.defaultFriendIDKey)
        defaultFriendID = storedFriendID != 0 ? storedFriendID : nil
        autoplayEnabled = UserDefaults.standard.bool(forKey: Self.autoplayEnabledKey)
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
