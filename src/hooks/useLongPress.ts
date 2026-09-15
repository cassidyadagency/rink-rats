"use client";
import { useRef } from "react";

export function useLongPress(onLongPress: () => void, ms = 500) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const clear = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  return {
    fired,
    handlers: {
      onPointerDown: () => { fired.current = false; clear(); timer.current = setTimeout(() => { fired.current = true; onLongPress(); }, ms); },
      onPointerUp: clear,
      onPointerLeave: clear,
      onPointerCancel: clear,
    },
  };
}
