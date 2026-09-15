import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ShiftCard } from "./ShiftCard";

const totals = { currentShiftClockSec: 42, currentShiftRealSec: 50, totalClockSec: 378, totalRealSec: 400, shiftCount: 3 };

describe("ShiftCard", () => {
  it("reflects on-ice state and totals", () => {
    render(<ShiftCard name="#17 Jake" on totals={totals} showRealTime={false} onToggle={() => {}} onLongPress={() => {}} />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(btn).toHaveTextContent("ON ICE");
    expect(btn).toHaveTextContent("shift 0:42");
    expect(btn).toHaveTextContent("total 6:18");
    expect(btn).toHaveTextContent("3 shifts");
  });
  it("shows real time when enabled", () => {
    render(<ShiftCard name="#17 Jake" on={false} totals={totals} showRealTime onToggle={() => {}} onLongPress={() => {}} />);
    expect(screen.getByRole("button")).toHaveTextContent("OFF ICE");
    expect(screen.getByRole("button")).toHaveTextContent("real 6:40");
  });
});
