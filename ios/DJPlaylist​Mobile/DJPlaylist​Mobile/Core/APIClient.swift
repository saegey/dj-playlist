import Foundation

enum APIError: LocalizedError {
    case invalidServerURL
    case invalidResponse
    case serverError(statusCode: Int, message: String)
    case decodingError(String)
    case networkError(String)

    var errorDescription: String? {
        switch self {
        case .invalidServerURL:
            return "Invalid server URL."
        case .invalidResponse:
            return "Invalid response from server."
        case let .serverError(statusCode, message):
            return "Server error \(statusCode): \(message)"
        case let .decodingError(message):
            return message
        case let .networkError(message):
            return message
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
        } catch let error as DecodingError {
            throw APIError.decodingError(Self.message(for: error))
        } catch {
            throw APIError.decodingError(error.localizedDescription)
        }
    }

    func rawRequest(path: String, method: String = "GET", body: Data? = nil) async throws -> Data {
        guard var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false) else {
            throw APIError.invalidServerURL
        }

        let normalizedPath = path.hasPrefix("/") ? path : "/\(path)"
        if let splitIndex = normalizedPath.firstIndex(of: "?") {
            components.path = String(normalizedPath[..<splitIndex])
            components.percentEncodedQuery = String(normalizedPath[normalizedPath.index(after: splitIndex)...])
        } else {
            components.path = normalizedPath
        }

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
        Self.debugLogRequest(request)

        let data: Data
        let response: URLResponse

        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch let urlError as URLError {
            Self.debugLogTransportError(url: url, error: urlError)
            throw APIError.networkError(Self.message(for: urlError, url: url))
        } catch {
            Self.debugLogUnexpectedError(url: url, error: error)
            throw APIError.networkError(error.localizedDescription)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        Self.debugLogResponse(httpResponse, data: data)

        guard (200 ..< 300).contains(httpResponse.statusCode) else {
            let message = Self.serverErrorMessage(from: data)
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

    private static func message(for error: URLError, url: URL) -> String {
        switch error.code {
        case .notConnectedToInternet:
            return "No internet connection."
        case .timedOut:
            return "Connection timed out while contacting \(url.host ?? "the server")."
        case .cannotFindHost, .cannotConnectToHost, .dnsLookupFailed:
            return "Could not reach \(url.host ?? "the server"). Check the address, port, and that the server is reachable from the simulator."
        case .appTransportSecurityRequiresSecureConnection:
            return "The connection was blocked by transport security settings."
        default:
            return error.localizedDescription
        }
    }

    private static func serverErrorMessage(from data: Data) -> String {
        guard var message = String(data: data, encoding: .utf8)?
            .trimmingCharacters(in: .whitespacesAndNewlines),
            !message.isEmpty else {
            return "Unknown server error"
        }

        if message.contains("<html") || message.contains("<!DOCTYPE html") {
            return "The server returned an HTML error page instead of the expected API response."
        }

        if message.count > 180 {
            message = String(message.prefix(177)) + "..."
        }

        return message
    }

    private static func message(for error: DecodingError) -> String {
        switch error {
        case let .keyNotFound(key, context):
            return "Missing field '\(key.stringValue)' in server response at \(codingPathDescription(context.codingPath))."
        case let .typeMismatch(type, context):
            return "Expected \(type) at \(codingPathDescription(context.codingPath)), but the server returned a different shape."
        case let .valueNotFound(type, context):
            return "Missing \(type) value at \(codingPathDescription(context.codingPath))."
        case let .dataCorrupted(context):
            return "Invalid server data at \(codingPathDescription(context.codingPath)): \(context.debugDescription)"
        @unknown default:
            return "Could not decode server response."
        }
    }

    private static func codingPathDescription(_ codingPath: [CodingKey]) -> String {
        guard !codingPath.isEmpty else { return "the top level" }
        return codingPath.map(\.stringValue).joined(separator: ".")
    }

    private static func debugLogRequest(_ request: URLRequest) {
#if DEBUG
        let method = request.httpMethod ?? "GET"
        print("[API] \(method) \(request.url?.absoluteString ?? "<missing-url>")")
        if let body = request.httpBody,
           let bodyString = String(data: body, encoding: .utf8),
           !bodyString.isEmpty {
            print("[API] Request Body: \(truncate(bodyString))")
        }
#endif
    }

    private static func debugLogResponse(_ response: HTTPURLResponse, data: Data) {
#if DEBUG
        print("[API] Response \(response.statusCode) \(response.url?.absoluteString ?? "<missing-url>")")
        if let bodyString = String(data: data, encoding: .utf8),
           !bodyString.isEmpty {
            print("[API] Response Body: \(truncate(bodyString))")
        }
#endif
    }

    private static func debugLogTransportError(url: URL, error: URLError) {
#if DEBUG
        print("[API] Transport Error \(url.absoluteString): \(error)")
#endif
    }

    private static func debugLogUnexpectedError(url: URL, error: Error) {
#if DEBUG
        print("[API] Unexpected Error \(url.absoluteString): \(error)")
#endif
    }

    private static func truncate(_ string: String, limit: Int = 1200) -> String {
        guard string.count > limit else { return string }
        return String(string.prefix(limit)) + "... [truncated]"
    }
}
