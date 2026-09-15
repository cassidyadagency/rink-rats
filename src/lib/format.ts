import type { Player } from "@/db/schema";

export function playerName(p: Pick<Player, "firstName" | "lastName" | "jersey">): string {
  return `#${p.jersey} ${p.firstName} ${p.lastName}`.trim();
}

export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
