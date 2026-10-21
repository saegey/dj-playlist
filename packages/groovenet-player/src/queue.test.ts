import { describe, expect, it } from "vitest";
import type { Track } from "@groovenet/client";
import { TrackQueue } from "./queue.js";

const track = (track_id: string) => ({ track_id }) as unknown as Track;

describe("TrackQueue", () => {
  it("adds entries at a requested position and preserves their order", () => {
    const queue = new TrackQueue();
    const [first] = queue.add([track("a"), track("b")]);
    queue.add([track("c")], 1);

    expect(queue.items.map(({ track: item }) => item.track_id)).toEqual(["a", "c", "b"]);
    expect(queue.items[0]?.id).toBe(first?.id);
  });

  it("removes by id or index and moves entries", () => {
    const queue = new TrackQueue();
    const entries = queue.add([track("a"), track("b"), track("c")]);
    queue.move(0, 2);

    expect(queue.items.map(({ track: item }) => item.track_id)).toEqual(["b", "c", "a"]);
    expect(queue.remove(entries[1]!.id)?.track.track_id).toBe("b");
    expect(queue.remove(0)?.track.track_id).toBe("c");
    expect(queue.remove("missing")).toBeUndefined();
  });

  it("takes an entry and rejects invalid insertion and move indexes", () => {
    const queue = new TrackQueue();
    queue.add([track("a")]);
    expect(queue.take(0)?.track.track_id).toBe("a");
    expect(queue.take(0)).toBeUndefined();
    expect(() => queue.add([track("b")], 3)).toThrow(RangeError);
    expect(() => queue.move(0, 1)).toThrow(RangeError);
  });
});
