import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PlayPauseButton } from "./PlayPauseButton";

describe("PlayPauseButton", () => {
  it("shows Play when paused and Pause when running", () => {
    const { rerender } = render(<PlayPauseButton running={false} disabled={false} stopTime onPlay={() => {}} onPause={() => {}} />);
    expect(screen.getByRole("button", { name: /play/i })).toHaveClass("w-full");
    rerender(<PlayPauseButton running disabled={false} stopTime onPlay={() => {}} onPause={() => {}} />);
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
  });
  it("renders nothing while running in running-time mode", () => {
    const { container } = render(<PlayPauseButton running disabled={false} stopTime={false} onPlay={() => {}} onPause={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
