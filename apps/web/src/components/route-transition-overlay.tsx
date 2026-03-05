"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin progress bar at the top of the viewport shown during route transitions.
 * Uses usePathname + useSearchParams to detect navigation.
 *
 * Deterministic initial state: isActive = false on first render (both server
 * and client agree — no hydration mismatch).
 *
 * Must be mounted inside a <Suspense> boundary in layout.tsx because it calls
 * useSearchParams().
 */
export function RouteTransitionOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track previous route to detect change
  const prevRoute = useRef<string>("");

  const currentRoute = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    if (prevRoute.current === "") {
      // First render — record route but do not show bar
      prevRoute.current = currentRoute;
      return;
    }
    if (prevRoute.current === currentRoute) return;

    // Route changed — start bar
    prevRoute.current = currentRoute;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (completeRef.current) clearTimeout(completeRef.current);

    setVisible(true);
    setProgress(10);
    timerRef.current = setTimeout(() => setProgress(70), 100);

    // Complete and hide after a short delay (content is already rendered)
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
