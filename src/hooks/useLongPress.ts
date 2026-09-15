"use client";
import { useCallback, useEffect, useRef } from "react";

export function useLongPress(onLongPress: () => void, ms = 500) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => clear, [clear]);

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
