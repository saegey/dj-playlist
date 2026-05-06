import AVFoundation
import Combine
import Foundation
import MediaPlayer
import UIKit

enum AudioPlayerError: LocalizedError {
    case missingAudioURL
    case invalidAudioURL
    case playbackFailed(String)

    var errorDescription: String? {
        switch self {
        case .missingAudioURL:
            return "This track does not have an audio file."
        case .invalidAudioURL:
            return "Could not build a playable audio URL."
        case let .playbackFailed(message):
            return message
        }
    }
}

private struct QueueEntry: Identifiable {
    let track: Track
    let localFileURL: URL

    var id: String { track.id }
}

@MainActor
final class AudioPlayerService: ObservableObject {
    @Published private(set) var currentTrackID: String?
    @Published private(set) var currentTrack: Track?
    @Published private(set) var isPlaying = false
    @Published private(set) var errorMessage: String?
    @Published private(set) var queuedTrackIDs: [String] = []
    @Published private(set) var elapsedTime: Double = 0
    @Published private(set) var totalDuration: Double = 0

    private let fileManager = FileManager.default
    private let player = AVQueuePlayer()
    private var queueEntries: [QueueEntry] = []
    private var currentIndex = 0
    private var playbackEndedObserver: NSObjectProtocol?
    private var playbackFailedObserver: NSObjectProtocol?
    private var playerItemStatusObservation: NSKeyValueObservation?
    private var currentItemObservation: NSKeyValueObservation?
    private var timeControlStatusObservation: NSKeyValueObservation?
    private var timeObserverToken: Any?
    private var artworkLoadTask: Task<Void, Never>?
    private var pendingTracks: [Track] = []
    private var pendingServerURL: URL?
    private var isPreparingMore = false
    private let lookAheadCount = 3

    init() {
        configurePlayerObservers()
        configureRemoteCommands()
    }

    func togglePlayback(for track: Track, serverURL: URL) async throws {
        errorMessage = nil

        if currentTrackID == track.id, !queueEntries.isEmpty {
            if isPlaying {
                pause()
            } else {
                player.play()
                updatePlaybackState()
                refreshNowPlayingInfo()
            }
            return
        }

        try await play(tracks: [track], startingAt: 0, serverURL: serverURL)
    }

    func play(tracks: [Track], startingAt startIndex: Int = 0, serverURL: URL) async throws {
        errorMessage = nil
        guard !tracks.isEmpty else { return }
        guard tracks.indices.contains(startIndex) else {
            throw AudioPlayerError.invalidAudioURL
        }

        try configureAudioSession()

        pendingTracks = Array(tracks[startIndex...])
        pendingServerURL = serverURL

        let initialBatch = Array(pendingTracks.prefix(lookAheadCount))
        pendingTracks.removeFirst(min(lookAheadCount, pendingTracks.count))

        let preparedEntries = try await prepareQueueEntries(for: initialBatch, serverURL: serverURL)
        guard !preparedEntries.isEmpty else {
            throw AudioPlayerError.playbackFailed("No playable tracks were found in this playlist.")
        }

        replaceQueue(with: preparedEntries, startAt: 0)
        player.play()
        updatePlaybackState()
        refreshNowPlayingInfo()
    }

    func pause() {
        player.pause()
        updatePlaybackState()
        refreshNowPlayingInfo()
    }

    func stop() {
        player.pause()
        player.removeAllItems()
        queueEntries = []
        queuedTrackIDs = []
        pendingTracks = []
        pendingServerURL = nil
        currentTrackID = nil
        currentTrack = nil
        currentIndex = 0
        errorMessage = nil
        isPlaying = false
        elapsedTime = 0
        totalDuration = 0
        artworkLoadTask?.cancel()
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    }

    func playQueuedPlaylist(_ tracks: [Track], serverURL: URL) async throws {
        try await play(tracks: tracks, startingAt: 0, serverURL: serverURL)
    }

    private func replaceQueue(with entries: [QueueEntry], startAt startIndex: Int) {
        queueEntries = entries
        queuedTrackIDs = entries.map(\.track.id)
        currentIndex = startIndex

        player.removeAllItems()
        for entry in entries[startIndex...] {
            player.insert(AVPlayerItem(url: entry.localFileURL), after: nil)
        }

        currentTrackID = entries[startIndex].track.id
        currentTrack = entries[startIndex].track
    }

    private func prepareQueueEntries(for tracks: [Track], serverURL: URL) async throws -> [QueueEntry] {
        var entries: [QueueEntry] = []
        entries.reserveCapacity(tracks.count)

        for track in tracks {
            guard let streamURL = streamURL(for: track, serverURL: serverURL) else { continue }
            let localFileURL = try await prepareLocalPlaybackURL(from: streamURL, track: track)
            entries.append(QueueEntry(track: track, localFileURL: localFileURL))
        }

        return entries
    }

    private func configureAudioSession() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playback, mode: .default)
        try session.setActive(true)
    }

    private func configurePlayerObservers() {
        currentItemObservation = player.observe(\.currentItem, options: [.initial, .new]) { [weak self] player, _ in
            MainActor.assumeIsolated {
                self?.observeStatus(for: player.currentItem)
                self?.synchronizeCurrentTrack(with: player.currentItem)
            }
        }

        timeControlStatusObservation = player.observe(\.timeControlStatus, options: [.initial, .new]) { [weak self] player, _ in
            MainActor.assumeIsolated {
                self?.isPlaying = player.timeControlStatus == .playing
                self?.refreshNowPlayingInfo()
            }
        }

        playbackEndedObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            MainActor.assumeIsolated {
                guard let self else { return }
                guard notification.object as? AVPlayerItem != nil else { return }
                self.handlePlaybackEnded()
            }
        }

        playbackFailedObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemFailedToPlayToEndTime,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            MainActor.assumeIsolated {
                let error = notification.userInfo?[AVPlayerItemFailedToPlayToEndTimeErrorKey] as? Error
                self?.handlePlaybackFailure(error)
            }
        }

        let interval = CMTime(seconds: 0.5, preferredTimescale: 600)
        timeObserverToken = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            MainActor.assumeIsolated {
                guard let self else { return }
                self.elapsedTime = time.seconds.isFinite ? time.seconds : 0
                if let item = self.player.currentItem {
                    let dur = item.duration.seconds
                    if dur.isFinite {
                        self.totalDuration = dur
                    } else if let track = self.queueEntries[safe: self.currentIndex]?.track {
                        self.totalDuration = self.playbackDurationSeconds(for: track) ?? 0
                    }
                }
                self.refreshNowPlayingInfo()
            }
        }
    }

    private func configureRemoteCommands() {
        let commandCenter = MPRemoteCommandCenter.shared()

        commandCenter.playCommand.removeTarget(nil)
        commandCenter.pauseCommand.removeTarget(nil)
        commandCenter.nextTrackCommand.removeTarget(nil)
        commandCenter.previousTrackCommand.removeTarget(nil)

        commandCenter.playCommand.addTarget { [weak self] _ in
            MainActor.assumeIsolated {
                self?.player.play()
                self?.updatePlaybackState()
                self?.refreshNowPlayingInfo()
            }
            return .success
        }

        commandCenter.pauseCommand.addTarget { [weak self] _ in
            MainActor.assumeIsolated {
                self?.pause()
            }
            return .success
        }

        commandCenter.nextTrackCommand.addTarget { [weak self] _ in
            MainActor.assumeIsolated {
                return self?.skipToNextTrack() ?? .commandFailed
            }
        }

        commandCenter.previousTrackCommand.addTarget { [weak self] _ in
            MainActor.assumeIsolated {
                return self?.skipToPreviousTrack() ?? .commandFailed
            }
        }
    }

    func skipToNext() {
        _ = skipToNextTrack()
    }

    private func skipToNextTrack() -> MPRemoteCommandHandlerStatus {
        guard currentIndex + 1 < queueEntries.count else { return .commandFailed }
        currentIndex += 1
        player.advanceToNextItem()
        currentTrackID = queueEntries[currentIndex].track.id
        currentTrack = queueEntries[currentIndex].track
        player.play()
        updatePlaybackState()
        refreshNowPlayingInfo()
        return .success
    }

    private func skipToPreviousTrack() -> MPRemoteCommandHandlerStatus {
        guard !queueEntries.isEmpty else { return .commandFailed }

        if player.currentTime().seconds > 3 {
            player.seek(to: .zero)
            refreshNowPlayingInfo()
            return .success
        }

        guard currentIndex > 0 else {
            player.seek(to: .zero)
            refreshNowPlayingInfo()
            return .success
        }

        currentIndex -= 1
        let remainingEntries = Array(queueEntries[currentIndex...])
        player.removeAllItems()
        for entry in remainingEntries {
            player.insert(AVPlayerItem(url: entry.localFileURL), after: nil)
        }
        currentTrackID = queueEntries[currentIndex].track.id
        currentTrack = queueEntries[currentIndex].track
        player.play()
        updatePlaybackState()
        refreshNowPlayingInfo()
        return .success
    }

    private func synchronizeCurrentTrack(with item: AVPlayerItem?) {
        guard item != nil else {
            if queueEntries.isEmpty {
                currentTrackID = nil
                currentTrack = nil
            }
            refreshNowPlayingInfo()
            return
        }

        guard queueEntries.indices.contains(currentIndex) else { return }
        currentTrackID = queueEntries[currentIndex].track.id
        currentTrack = queueEntries[currentIndex].track
        refreshNowPlayingInfo()
    }

    private func handlePlaybackEnded() {
        if currentIndex + 1 < queueEntries.count {
            currentIndex += 1
            currentTrackID = queueEntries[currentIndex].track.id
            currentTrack = queueEntries[currentIndex].track
            updatePlaybackState()
            refreshNowPlayingInfo()
            prepareMoreIfNeeded()
        } else if !pendingTracks.isEmpty {
            currentIndex += 1
            prepareMoreIfNeeded()
        } else {
            stop()
        }
    }

    private func prepareMoreIfNeeded() {
        let itemsAhead = queueEntries.count - currentIndex - 1
        guard itemsAhead < lookAheadCount, !pendingTracks.isEmpty, !isPreparingMore,
              let serverURL = pendingServerURL else { return }

        isPreparingMore = true
        let batch = Array(pendingTracks.prefix(lookAheadCount))
        pendingTracks.removeFirst(min(lookAheadCount, pendingTracks.count))

        Task {
            defer { isPreparingMore = false }
            let entries = (try? await prepareQueueEntries(for: batch, serverURL: serverURL)) ?? []
            for entry in entries {
                queueEntries.append(entry)
                queuedTrackIDs.append(entry.track.id)
                player.insert(AVPlayerItem(url: entry.localFileURL), after: nil)
            }
            if currentTrackID == nil, let first = entries.first {
                currentTrackID = first.track.id
                currentTrack = first.track
                player.play()
                updatePlaybackState()
                refreshNowPlayingInfo()
            }
        }
    }

    private func updatePlaybackState() {
        isPlaying = player.timeControlStatus == .playing || player.rate > 0
    }

    private func observeStatus(for item: AVPlayerItem?) {
        playerItemStatusObservation = item?.observe(\.status, options: [.initial, .new]) { [weak self] item, _ in
            MainActor.assumeIsolated {
                switch item.status {
                case .failed:
                    self?.handlePlaybackFailure(item.error)
                case .readyToPlay:
                    self?.refreshNowPlayingInfo()
                case .unknown:
                    break
                @unknown default:
                    break
                }
            }
        }
    }

    private func handlePlaybackFailure(_ error: Error?) {
        let message = error?.localizedDescription ?? "Playback failed."
        errorMessage = AudioPlayerError.playbackFailed(message).localizedDescription
        stop()
    }

    private func refreshNowPlayingInfo() {
        guard queueEntries.indices.contains(currentIndex) else {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
            return
        }

        let entry = queueEntries[currentIndex]
        var info: [String: Any] = [
            MPMediaItemPropertyTitle: entry.track.displayTitle,
            MPMediaItemPropertyArtist: entry.track.displayArtist,
            MPNowPlayingInfoPropertyPlaybackRate: isPlaying ? 1.0 : 0.0,
            MPNowPlayingInfoPropertyPlaybackQueueIndex: currentIndex,
            MPNowPlayingInfoPropertyPlaybackQueueCount: queueEntries.count,
            MPNowPlayingInfoPropertyElapsedPlaybackTime: player.currentTime().seconds
        ]

        if let duration = playbackDurationSeconds(for: entry.track) {
            info[MPMediaItemPropertyPlaybackDuration] = duration
        }

        MPNowPlayingInfoCenter.default().nowPlayingInfo = info

        artworkLoadTask?.cancel()
        if let albumArtURL = entry.track.albumArtURL {
            artworkLoadTask = Task { [weak self] in
                guard let self else { return }
                if let artwork = await self.loadArtwork(from: albumArtURL) {
                    var refreshed = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? info
                    refreshed[MPMediaItemPropertyArtwork] = artwork
                    MPNowPlayingInfoCenter.default().nowPlayingInfo = refreshed
                }
            }
        }
    }

    private func loadArtwork(from url: URL) async -> MPMediaItemArtwork? {
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            guard let image = UIImage(data: data) else { return nil }
            return MPMediaItemArtwork(boundsSize: image.size) { _ in image }
        } catch {
            return nil
        }
    }

    private func playbackDurationSeconds(for track: Track) -> Double? {
        if let seconds = track.durationSeconds, seconds > 0 {
            return seconds
        }
        guard let duration = track.displayDuration else { return nil }
        let components = duration.split(separator: ":").map { Int($0) ?? 0 }
        if components.count == 2 {
            return Double((components[0] * 60) + components[1])
        }
        if components.count == 3 {
            return Double((components[0] * 3600) + (components[1] * 60) + components[2])
        }
        return nil
    }

    private func streamURL(for track: Track, serverURL: URL) -> URL? {
        guard let rawAudioURL = track.localAudioURL?.trimmingCharacters(in: .whitespacesAndNewlines),
              !rawAudioURL.isEmpty else {
            return nil
        }

        let filename = extractFilename(from: rawAudioURL)
        guard !filename.isEmpty else { return nil }

        var components = URLComponents(url: serverURL, resolvingAgainstBaseURL: false)
        components?.path = "/api/audio"
        components?.queryItems = [URLQueryItem(name: "filename", value: filename)]
        return components?.url
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
            if !lastPath.isEmpty {
                return lastPath
            }
        }

        return raw
            .replacingOccurrences(of: "app/audio/", with: "")
            .replacingOccurrences(of: "audio/", with: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func prepareLocalPlaybackURL(from remoteURL: URL, track: Track) async throws -> URL {
        if let downloadedFileURL = downloadedAudioFileURL(for: track),
           fileManager.fileExists(atPath: downloadedFileURL.path) {
            return downloadedFileURL
        }

        let destinationURL = try cachedAudioFileURL(for: track, remoteURL: remoteURL)
        if fileManager.fileExists(atPath: destinationURL.path) {
            return destinationURL
        }

        let (tempURL, response) = try await URLSession.shared.download(from: remoteURL)
        guard let httpResponse = response as? HTTPURLResponse,
              (200 ..< 300).contains(httpResponse.statusCode) else {
            throw AudioPlayerError.playbackFailed("Audio download failed.")
        }

        let parentURL = destinationURL.deletingLastPathComponent()
        try fileManager.createDirectory(at: parentURL, withIntermediateDirectories: true)
        if fileManager.fileExists(atPath: destinationURL.path) {
            try fileManager.removeItem(at: destinationURL)
        }
        try fileManager.moveItem(at: tempURL, to: destinationURL)
        return destinationURL
    }

    private func downloadedAudioFileURL(for track: Track) -> URL? {
        let filename = extractFilename(from: track.localAudioURL ?? "")
        guard !filename.isEmpty else { return nil }
        return DownloadService.downloadedFileURL(for: filename)
    }

    private func cachedAudioFileURL(for track: Track, remoteURL: URL) throws -> URL {
        guard let cachesDirectory = fileManager.urls(for: .cachesDirectory, in: .userDomainMask).first else {
            throw AudioPlayerError.invalidAudioURL
        }

        let remoteExtension = remoteURL.pathExtension.trimmingCharacters(in: .whitespacesAndNewlines)
        let localExtension = track.localAudioURL?
            .split(separator: ".")
            .last
            .map(String.init)?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let safeExtension = !remoteExtension.isEmpty ? remoteExtension : ((localExtension?.isEmpty == false ? localExtension! : "m4a"))
        let safeTrackID = track.trackID.replacingOccurrences(of: "/", with: "_")
        return cachesDirectory
            .appendingPathComponent("preview-audio", isDirectory: true)
            .appendingPathComponent("\(safeTrackID).\(safeExtension)")
    }

    var hasNext: Bool {
        currentIndex + 1 < queueEntries.count
    }

    func resume() {
        player.play()
        updatePlaybackState()
        refreshNowPlayingInfo()
    }

    deinit {
        if let playbackEndedObserver {
            NotificationCenter.default.removeObserver(playbackEndedObserver)
        }
        if let playbackFailedObserver {
            NotificationCenter.default.removeObserver(playbackFailedObserver)
        }
        if let timeObserverToken {
            player.removeTimeObserver(timeObserverToken)
        }
    }
}

private extension Array {
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
