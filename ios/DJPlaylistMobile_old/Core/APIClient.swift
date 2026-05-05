import Foundation

enum APIError: LocalizedError {
    case invalidServerURL
    case invalidResponse
    case serverError(statusCode: Int, message: String)
    case decodingError

    var errorDescription: String? {
        switch self {
        case .invalidServerURL:
            return "Invalid server URL."
        case .invalidResponse:
            return "Invalid response from server."
        case let .serverError(statusCode, message):
            return "Server error \(statusCode): \(message)"
        case .decodingError:
            return "Could not decode server response."
        }
    }
}

struct APIClient {
    let baseURL: URL

    init(serverURL: URL) {
        self.baseURL = serverURL
    }

    func request<T: Decodable>(
        path: String,
        method: String = "GET",
        body: Data? = nil,
        decoder: JSONDecoder = JSONDecoder()
    ) async throws -> T {
        let data = try await rawRequest(path: path, method: method, body: body)

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError
        }
    }

    func rawRequest(path: String, method: String = "GET", body: Data? = nil) async throws -> Data {
        guard var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false) else {
            throw APIError.invalidServerURL
        }

        let normalizedPath = path.hasPrefix("/") ? path : "/\(path)"
        components.path = normalizedPath

        guard let url = components.url else {
            throw APIError.invalidServerURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 20
        if let body {
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200 ..< 300).contains(httpResponse.statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "Unknown server error"
            throw APIError.serverError(statusCode: httpResponse.statusCode, message: message)
        }

        return data
    }

    func downloadFile(from absoluteURL: URL, to destinationURL: URL) async throws {
        let (tempFileURL, response) = try await URLSession.shared.download(from: absoluteURL)
        guard let httpResponse = response as? HTTPURLResponse,
              (200 ..< 300).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        let fm = FileManager.default
        let parent = destinationURL.deletingLastPathComponent()
        try fm.createDirectory(at: parent, withIntermediateDirectories: true)

        if fm.fileExists(atPath: destinationURL.path) {
            try fm.removeItem(at: destinationURL)
        }

        try fm.moveItem(at: tempFileURL, to: destinationURL)
    }
}
