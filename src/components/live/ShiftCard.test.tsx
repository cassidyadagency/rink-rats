import { fireEvent, render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ShiftCard } from "./ShiftCard";

const totals = { currentShiftClockSec: 42, currentShiftRealSec: 50, totalClockSec: 378, totalRealSec: 400, shiftCount: 3 };

afterEach(() => vi.useRealTimers());

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

  it("long-press opens back-date and swallows the following click; the next tap toggles", () => {
    vi.useFakeTimers();
    const onToggle = vi.fn(); const onLongPress = vi.fn();
    render(<ShiftCard name="#17 Jake" on={false} totals={totals} showRealTime={false} onToggle={onToggle} onLongPress={onLongPress} />);
    const btn = screen.getByRole("button");
    fireEvent.pointerDown(btn);
    act(() => { vi.advanceTimersByTime(500); });
    fireEvent.pointerUp(btn);
    fireEvent.click(btn);
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
    fireEvent.pointerDown(btn);
    fireEvent.pointerUp(btn);
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("a short tap does not trigger long-press", () => {
    vi.useFakeTimers();
    const onToggle = vi.fn(); const onLongPress = vi.fn();
    render(<ShiftCard name="#17 Jake" on={false} totals={totals} showRealTime={false} onToggle={onToggle} onLongPress={onLongPress} />);
    const btn = screen.getByRole("button");
    fireEvent.pointerDown(btn);
    act(() => { vi.advanceTimersByTime(200); });
    fireEvent.pointerUp(btn);
    fireEvent.click(btn);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(onLongPress).not.toHaveBeenCalled();
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
