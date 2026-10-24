import { beforeEach, describe, expect, it, vi } from "vitest";

const service = vi.hoisted(() => ({
  getAppearance: vi.fn(),
  updateAppearance: vi.fn(),
}));
vi.mock("@/server/services/settingsService", () => ({ settingsService: service }));

import { GET, PUT } from "../route";

const put = (body: string) =>
  PUT(new Request("http://localhost/api/settings/appearance", { method: "PUT", body }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/settings/appearance", () => {
  it("returns the shared palette", async () => {
    service.getAppearance.mockResolvedValue({ palette: "sleeve" });

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ palette: "sleeve" });
  });

  it("returns 500 when loading fails", async () => {
    service.getAppearance.mockRejectedValue(new Error("db down"));
    expect((await GET()).status).toBe(500);
  });
});

describe("PUT /api/settings/appearance", () => {
  it("saves a registered palette", async () => {
    service.updateAppearance.mockResolvedValue({ palette: "sleeve" });

    const res = await put(JSON.stringify({ palette: "sleeve" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ palette: "sleeve" });
    expect(service.updateAppearance).toHaveBeenCalledWith("sleeve");
  });

  it.each([
    ["an unknown palette", JSON.stringify({ palette: "vaporwave" })],
    ["a missing palette", JSON.stringify({})],
    ["a non-string palette", JSON.stringify({ palette: 3 })],
    ["a prototype key", JSON.stringify({ palette: "constructor" })],
  ])("rejects %s", async (_label, body) => {
    const res = await put(body);

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("sleeve");
    expect(service.updateAppearance).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON", async () => {
    expect((await put("{nope")).status).toBe(400);
    expect(service.updateAppearance).not.toHaveBeenCalled();
  });

  it("returns 500 when saving fails", async () => {
    service.updateAppearance.mockRejectedValue(new Error("db down"));
    expect((await put(JSON.stringify({ palette: "sleeve" }))).status).toBe(500);
  });
});
