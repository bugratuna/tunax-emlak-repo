"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin progress bar at the top of the viewport shown during route transitions.
 * Uses usePathname + useSearchParams to detect navigation.
 *
 * Deterministic initial state: visible = false on first render (both server
 * and client agree — no hydration mismatch).
 *
 * Must be mounted inside a <Suspense> boundary in layout.tsx because it calls
 * useSearchParams().
 */
export function RouteTransitionOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRoute = `${pathname}?${searchParams.toString()}`;

  // prevRoute as state so route-change detection happens during render,
  // avoiding setState calls in the effect body (react-compiler constraint).
  const [prevRoute, setPrevRoute] = useState(currentRoute);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Written only inside the effect (never during render) — safe for React Compiler.
  const isMountedRef = useRef(false);

  // Derived-state: detect route change during render and start the bar immediately.
  // getDerivedStateFromProps pattern — React re-renders synchronously with new state.
  if (prevRoute !== currentRoute) {
    setPrevRoute(currentRoute);
    setVisible(true);
    setProgress(10);
  }

  // Only the async (timer-driven) progress updates remain in the effect.
  // isMountedRef (written inside the effect) prevents running on initial mount.
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    if (completeRef.current) clearTimeout(completeRef.current);

    timerRef.current = setTimeout(() => setProgress(70), 100);
    completeRef.current = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setVisible(false), 250);
    }, 350);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (completeRef.current) clearTimeout(completeRef.current);
    };
  }, [currentRoute]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-1"
    >
      <div
        className="h-full bg-blue-500 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
