import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Timeline } from "./Timeline";
import type { TimelineEntry } from "@/domain/reducer";

const entry = (seq: number, type: "shot" | "goal", undone = false, undoneBy?: number): TimelineEntry => ({
  event: { id: `e${seq}`, gameId: "g", seq, wallTime: 0, type, clock: { period: 1, secRemaining: 900 - seq } },
  undone, undoneBy,
});

describe("Timeline", () => {
  it("shows newest first, with delete for live rows and restore for undone rows", async () => {
    const onDelete = vi.fn(); const onRestore = vi.fn();
    render(<Timeline entries={[entry(1, "shot"), entry(2, "goal", true, 3)]} roster={[]} onDelete={onDelete} onRestore={onRestore} onAnnotate={() => {}} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("Goal");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /restore/i }));
    expect(onRestore).toHaveBeenCalledWith(3);
    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith(1);
  });
  it("limits rows and expands", async () => {
    render(<Timeline entries={[entry(1, "shot"), entry(2, "shot"), entry(3, "shot")]} roster={[]} limit={2} onDelete={() => {}} onRestore={() => {}} onAnnotate={() => {}} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    await userEvent.setup().click(screen.getByRole("button", { name: /show all/i }));
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});
