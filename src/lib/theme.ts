"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

/** Assinantes do tema (o <html> é a fonte da verdade; aqui só avisamos o React). */
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

/** Reads the theme currently applied to <html> (absence of attr = light). */
function readAppliedTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/** Snapshot do servidor/hidratação: o valor real só é conhecido no cliente. */
const readServerTheme = (): Theme => "light";

const readMounted = (): boolean => true;
const readServerMounted = (): boolean => false;

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
  for (const listener of listeners) listener();
}

/**
 * Client hook for the light/dark theme.
 *
 * The real theme is applied before paint by the inline script in the root
 * layout, so <html data-theme> is the external store we subscribe to.
 * `mounted` lets callers avoid rendering theme-dependent UI (e.g. the toggle
 * icon) until the client value is known, preventing hydration mismatches.
 */
export function useTheme(): { theme: Theme; mounted: boolean; toggleTheme: () => void } {
  const theme = useSyncExternalStore(subscribe, readAppliedTheme, readServerTheme);
  const mounted = useSyncExternalStore(subscribe, readMounted, readServerMounted);

  const toggleTheme = useCallback(() => {
    applyTheme(readAppliedTheme() === "dark" ? "light" : "dark");
  }, []);

  return { theme, mounted, toggleTheme };
}
