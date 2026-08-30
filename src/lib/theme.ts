"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

/** Reads the theme currently applied to <html> (absence of attr = light). */
function readAppliedTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/** Applies the theme to <html> and persists the user's explicit choice. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "dark") root.dataset.theme = "dark";
  else delete root.dataset.theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* localStorage unavailable (private mode / SSR) — ignore */
  }
}

/**
 * Client hook for the light/dark theme.
 *
 * The real theme is applied before paint by the inline script in the root
 * layout, so on mount we sync React state to whatever <html> already carries.
 * `mounted` lets callers avoid rendering theme-dependent UI (e.g. the toggle
 * icon) until the client value is known, preventing hydration mismatches.
 */
export function useTheme(): { theme: Theme; mounted: boolean; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readAppliedTheme());
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      return next;
    });
  }, []);

  return { theme, mounted, toggleTheme };
}
