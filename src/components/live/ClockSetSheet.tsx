"use client";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";

function digitsToSec(digits: string): number {
  const padded = digits.padStart(4, "0").slice(-4);
  return Number(padded.slice(0, 2)) * 60 + Number(padded.slice(2));
}
function secToDigits(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m.toString().padStart(2, "0")}${s.toString().padStart(2, "0")}`;
}

/**
 * Owns the period/digits state, initialized fresh from props each time it
 * mounts. Sheet unmounts its children while closed, and ClockSetSheet keys
 * this component on the initial values, so a reopen (or a change to the
 * initial values while open) always starts from the current values instead
 * of stale local state — without setState-in-effect.
 */
function ClockPad({
  initialPeriod,
  initialSec,
  periodCount,
  periodLengthSec,
  onClose,
  onSet,
  onEndPeriod,
}: {
  initialPeriod: number;
  initialSec: number;
  periodCount: number;
  periodLengthSec: number;
  onClose: () => void;
  onSet: (period: number, secRemaining: number) => void;
  onEndPeriod?: () => void;
}) {
  const [period, setPeriod] = useState(initialPeriod);
  const [digits, setDigits] = useState(secToDigits(initialSec));

  const shown = digits.padStart(4, "0").slice(-4);
  const commit = () => {
    onSet(period, Math.min(periodLengthSec, Math.max(0, digitsToSec(digits))));
    onClose();
  };

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <Button aria-label="Previous period" onClick={() => setPeriod((p) => Math.max(1, p - 1))}>
          −
        </Button>
        <span className="text-xl font-bold">Period {period}</span>
        <Button aria-label="Next period" onClick={() => setPeriod((p) => Math.min(periodCount, p + 1))}>
          +
        </Button>
      </div>
      <div data-testid="clock-entry" className="mb-3 text-center font-mono text-5xl tabular-nums">
        {shown.slice(0, 2)}:{shown.slice(2)}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <Button key={d} size="lg" onClick={() => setDigits((x) => (x + d).slice(-4))}>
            {d}
          </Button>
        ))}
        <Button size="lg" onClick={() => setDigits("")}>
          Clear
        </Button>
        <Button size="lg" onClick={() => setDigits((x) => (x + "0").slice(-4))}>
          0
        </Button>
        <Button size="lg" onClick={() => setDigits((x) => x.slice(0, -1))} aria-label="Backspace">
          ⌫
        </Button>
      </div>
      <div className="mt-3 space-y-2">
        <Button variant="primary" size="xl" onClick={commit}>
          Set clock
        </Button>
        {onEndPeriod && (
          <Button
            variant="ghost"
            size="xl"
            onClick={() => {
              onEndPeriod();
              onClose();
            }}
          >
            End period now
          </Button>
        )}
      </div>
    </>
  );
}

export function ClockSetSheet({
  open,
  initialPeriod,
  initialSec,
  periodCount,
  periodLengthSec,
  onClose,
  onSet,
  onEndPeriod,
}: {
  open: boolean;
  initialPeriod: number;
  initialSec: number;
  periodCount: number;
  periodLengthSec: number;
  onClose: () => void;
  onSet: (period: number, secRemaining: number) => void;
  onEndPeriod?: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Correct clock">
      <ClockPad
        key={`${initialPeriod}-${initialSec}`}
        initialPeriod={initialPeriod}
        initialSec={initialSec}
        periodCount={periodCount}
        periodLengthSec={periodLengthSec}
        onClose={onClose}
        onSet={onSet}
        onEndPeriod={onEndPeriod}
      />
    </Sheet>
  );
}
