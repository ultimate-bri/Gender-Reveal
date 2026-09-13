"use client";

import { useEffect, useRef, useState } from "react";

interface UseCountdownOptions {
  seconds: number;
  onComplete: () => void;
}

/**
 * Runs a countdown (seconds -> 1) once `start()` is called, then fires
 * onComplete. `count` is null when idle.
 */
export function useCountdown({ seconds, onComplete }: UseCountdownOptions) {
  const [count, setCount] = useState<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (count === null) return;

    if (count === 0) {
      onCompleteRef.current();
      setCount(null);
      return;
    }

    const timer = setTimeout(() => setCount((c) => (c === null ? null : c - 1)), 800);
    return () => clearTimeout(timer);
  }, [count]);

  const start = () => setCount(seconds);
  const isRunning = count !== null;

  return { count, start, isRunning };
}
