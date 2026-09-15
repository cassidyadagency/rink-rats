import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { UndoButton } from "./UndoButton";

describe("UndoButton", () => {
  it("is disabled with nothing to undo", () => {
    render(<UndoButton onUndo={() => {}} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
  it("labels what it will undo", () => {
    render(<UndoButton last={{ id: "x", gameId: "g", seq: 4, wallTime: 0, type: "shot", clock: { period: 2, secRemaining: 761 } }} onUndo={() => {}} />);
    expect(screen.getByRole("button")).toHaveTextContent("Undo Shot (P2 12:41)");
  });
});
