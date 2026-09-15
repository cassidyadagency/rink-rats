"use client";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { PlayerForm } from "@/components/PlayerForm";

export default function NewPlayerPage() {
  const router = useRouter();
  return (
    <main className="safe-b">
      <AppHeader title="Add player" back="/" />
      <PlayerForm onSaved={(p) => router.replace(`/player?id=${p.id}`)} />
    </main>
  );
}
