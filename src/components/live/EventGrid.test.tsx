import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EventGrid } from "./EventGrid";

describe("EventGrid", () => {
  it("hides events not in visibleEvents", () => {
    render(<EventGrid visibleEvents={["goal", "shot"]} position="F" onEvent={() => {}} />);
    expect(screen.getByRole("button", { name: "Goal" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Assist" })).toBeNull();
  });
  it("shows goalie buttons only for goalies", () => {
    const { rerender } = render(<EventGrid visibleEvents={["save", "goal_against", "shot"]} position="F" onEvent={() => {}} />);
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    rerender(<EventGrid visibleEvents={["save", "goal_against", "shot"]} position="G" onEvent={() => {}} />);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Goal Agn" })).toBeInTheDocument();
  });
});
