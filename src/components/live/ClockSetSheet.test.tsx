import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ClockSetSheet } from "./ClockSetSheet";

describe("ClockSetSheet", () => {
  it("fills digits from the right and clamps to the period length", async () => {
    const onSet = vi.fn();
    render(<ClockSetSheet open initialPeriod={2} initialSec={600} periodCount={3} periodLengthSec={900} onClose={() => {}} onSet={onSet} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Clear" }));
    for (const d of "1234") await user.click(screen.getByRole("button", { name: d }));
    expect(screen.getByTestId("clock-entry")).toHaveTextContent("12:34");
    await user.click(screen.getByRole("button", { name: "Set clock" }));
    expect(onSet).toHaveBeenCalledWith(2, 754);
  });
  it("steps the period within bounds", async () => {
    const onSet = vi.fn();
    render(<ClockSetSheet open initialPeriod={3} initialSec={100} periodCount={3} periodLengthSec={900} onClose={() => {}} onSet={onSet} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Next period" }));
    expect(screen.getByText("Period 3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Previous period" }));
    await user.click(screen.getByRole("button", { name: "Set clock" }));
    expect(onSet).toHaveBeenCalledWith(2, 100);
  });
});
