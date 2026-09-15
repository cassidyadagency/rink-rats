import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import Home from "./page";
import { db } from "@/db/schema";
import * as repo from "@/db/repo";

beforeEach(async () => { await db.delete(); await db.open(); });

describe("Home", () => {
  it("shows the empty state with a link to add a player", async () => {
    render(<Home />);
    expect(await screen.findByRole("link", { name: /add your player/i })).toHaveAttribute("href", "/player/new");
  });
  it("lists players with jersey and team", async () => {
    const team = await repo.createTeam({ name: "Hawks", season: "26-27", periodCount: 3, periodLengthSec: 900, stopTime: true, roster: [] });
    await repo.createPlayer({ firstName: "Jake", lastName: "C", jersey: 17, position: "F", teamId: team.id });
    render(<Home />);
    expect(await screen.findByText("#17 Jake C")).toBeInTheDocument();
    expect(screen.getByText("Hawks")).toBeInTheDocument();
  });
});
