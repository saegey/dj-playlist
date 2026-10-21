# Player control protocol

The player daemon listens on a Unix domain socket at `~/.groovenet/player/player.sock` and writes its process id to `~/.groovenet/player/player.pid`. Messages are UTF-8 JSON objects terminated by a newline. The protocol version is currently `1`.

Requests have `{ "jsonrpc": "2.0", "version": 1, "id": 1, "method": "status", "params": {} }`. Responses match the request id and contain either `result` or `{ "error": { "code", "message" } }`. A mismatched protocol version returns `VERSION_MISMATCH` and states the supported version. Notifications have `{ "jsonrpc": "2.0", "version": 1, "event": "state", "data": ... }`; events include state, position, queue-change, track-change, track-ended, and error.

Methods: `status`, `play` (`index` optional), `pause`, `resume`, `next`, `prev`, `seek` (`seconds`), `volume` (`volume`, 0–100), `queue.add` (`query` or `playlistId`), `queue.addTrack` (`track`), `queue.list`, `queue.remove` (`id` or `index`), `devices`, `devices.select` (`id`), and `shutdown`.
