import { describe, it, expect, vi } from "vitest";
import { backupFilename, shareOrDownload } from "./backup";

describe("backupFilename", () => {
  it("embeds the date", () => {
    expect(backupFilename(new Date(2026, 8, 14))).toBe("rink-rats-backup-2026-09-14.json");
  });
});

describe("shareOrDownload", () => {
  it("uses the share sheet when files can be shared", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { canShare: () => true, share });
    const file = new File(["{}"], "x.json", { type: "application/json" });
    expect(await shareOrDownload(file)).toBe("shared");
    expect(share).toHaveBeenCalledWith({ files: [file] });
  });
  it("falls back to a download link", async () => {
    Object.assign(navigator, { canShare: undefined, share: undefined });
    globalThis.URL.createObjectURL = vi.fn(() => "blob:x");
    globalThis.URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const file = new File(["{}"], "x.json", { type: "application/json" });
    expect(await shareOrDownload(file)).toBe("downloaded");
    expect(click).toHaveBeenCalled();
  });
});
