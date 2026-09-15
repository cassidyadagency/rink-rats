"use client";
export function PlayPauseButton({ running, disabled, stopTime, onPlay, onPause }: { running: boolean; disabled: boolean; stopTime: boolean; onPlay: () => void; onPause: () => void }) {
  if (running && !stopTime) return null;
  return (
    <button
      disabled={disabled}
      onClick={running ? onPause : onPlay}
      className={`mx-4 h-16 rounded-2xl text-2xl font-bold disabled:opacity-40 ${running ? "bg-amber-500 text-black" : "bg-emerald-500 text-black"}`}
    >
      {running ? "❚❚ Pause" : "▶ Play"}
    </button>
  );
}
