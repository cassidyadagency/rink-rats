import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PenaltyBanner } from "./PenaltyBanner";

describe("PenaltyBanner", () => {
  it("renders nothing without a penalty", () => {
    const { container } = render(<PenaltyBanner remainingSec={undefined} onBackOnIce={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
  it("counts down while serving", () => {
    render(<PenaltyBanner remainingSec={95} onBackOnIce={() => {}} />);
    expect(screen.getByText(/in the box · 1:35/i)).toBeInTheDocument();
  });
  it("prompts when served", () => {
    render(<PenaltyBanner remainingSec={0} onBackOnIce={() => {}} />);
    expect(screen.getByRole("button", { name: /back on ice/i })).toBeInTheDocument();
  });
});
