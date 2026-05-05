import Foundation

@MainActor
final class DownloadService: ObservableObject {
    @Published private(set) var downloadedFiles: [String] = []

    func refreshDownloadedFiles() {
        do {
            let urls = try FileManager.default.contentsOfDirectory(
                at: Self.downloadsDirectory,
                includingPropertiesForKeys: nil
            )
            downloadedFiles = urls.map(\.lastPathComponent).sorted()
        } catch {
            downloadedFiles = []
        }
    }

    func downloadTrack(_ track: Track, using client: APIClient) async throws {
        guard let localAudioURL = track.localAudioURL, !localAudioURL.isEmpty else {
            throw APIError.serverError(statusCode: 400, message: "Track has no local_audio_url")
        }

        let filename = extractFilename(from: localAudioURL)
        guard !filename.isEmpty else {
            throw APIError.serverError(statusCode: 400, message: "Could not derive audio filename")
        }

        var components = URLComponents(url: client.baseURL, resolvingAgainstBaseURL: false)
        components?.path = "/api/audio"
        components?.queryItems = [URLQueryItem(name: "filename", value: filename)]

        guard let audioURL = components?.url else {
            throw APIError.invalidServerURL
        }

        let destination = Self.downloadsDirectory.appendingPathComponent(filename)
        try await client.downloadFile(from: audioURL, to: destination)
        refreshDownloadedFiles()
    }

    private func extractFilename(from raw: String) -> String {
        if let parsed = URL(string: raw) {
            if let nested = URLComponents(url: parsed, resolvingAgainstBaseURL: false)?
                .queryItems?
                .first(where: { $0.name == "filename" })?
                .value,
               !nested.isEmpty {
                return nested
            }
            let lastPath = parsed.lastPathComponent
            if !lastPath.isEmpty { return lastPath }
        }

        return raw
            .replacingOccurrences(of: "app/audio/", with: "")
            .replacingOccurrences(of: "audio/", with: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static var downloadsDirectory: URL {
        let base = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        return base.appendingPathComponent("downloads", isDirectory: true)
    }
}
