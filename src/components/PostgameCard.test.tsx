import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PostgameCard } from "./PostgameCard";

const summary = {
  iceTimeClockSec: 378, iceTimeRealSec: 400, byPeriodClockSec: [120, 138, 120],
  shiftCount: 7, avgShiftSec: 54, longestShiftSec: 71,
  stats: { goal: 1, assist: 0, shot: 3, penalty: 0, save: 0, goal_against: 0 },
  tagCounts: [{ label: "Hustle", count: 2 }], moments: [{ seq: 9, period: 2, secRemaining: 700, note: "Nice rush" }],
};

describe("PostgameCard", () => {
  it("shows ice time, shifts, non-zero stats, tags and moments", () => {
    render(<PostgameCard playerLabel="#17 Jake C" teamName="Hawks" opponent="Bears" date="2026-09-14" summary={summary} note="Great game" showRealTime={false} />);
    const card = screen.getByTestId("postgame-card");
    expect(card).toHaveTextContent("6:18");
    expect(card).toHaveTextContent("7 shifts");
    expect(card).toHaveTextContent("1 Goal");
    expect(card).toHaveTextContent("3 Shots");
    expect(card).not.toHaveTextContent("Assist");
    expect(card).toHaveTextContent("Hustle ×2");
    expect(card).toHaveTextContent("Nice rush");
    expect(card).toHaveTextContent("Great game");
  });
});
