import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNow } from "./useNow";

afterEach(() => vi.useRealTimers());

describe("useNow", () => {
  it("ticks while active", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const { result } = renderHook(() => useNow(true, 250));
    expect(result.current).toBe(1_000);
    act(() => { vi.advanceTimersByTime(500); });
    expect(result.current).toBe(1_500);
  });
  it("freezes while inactive", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const { result } = renderHook(() => useNow(false, 250));
    act(() => { vi.setSystemTime(5_000); vi.advanceTimersByTime(1000); });
    expect(result.current).toBe(1_000);
  });
  it("re-samples on visibilitychange", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const { result } = renderHook(() => useNow(true, 250));
    act(() => { vi.setSystemTime(9_000); document.dispatchEvent(new Event("visibilitychange")); });
    expect(result.current).toBe(9_000);
  });
});
