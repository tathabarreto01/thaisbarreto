"use client";

import { useEffect, useEffectEvent } from "react";

/** Tempo de inatividade até a sessão cair. Ajuste aqui se precisar. */
export const IDLE_TIMEOUT_MINUTES = 30;

const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60_000;

/** Guardado em sessionStorage para o contador sobreviver a um reload na mesma aba. */
const LAST_ACTIVITY_KEY = "mp-last-activity";

/** `mousemove` fica de fora de propósito: dispara demais e nunca deixaria expirar. */
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart", "scroll"] as const;

/** Evita gravar no storage a cada frame de scroll. */
const WRITE_INTERVAL_MS = 5_000;

function readLastActivity(): number | null {
  try {
    const raw = window.sessionStorage.getItem(LAST_ACTIVITY_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeLastActivity(at: number): void {
  try {
    window.sessionStorage.setItem(LAST_ACTIVITY_KEY, String(at));
  } catch {
    // Storage bloqueado: o contador em memória ainda funciona nesta aba.
  }
}

function clearLastActivity(): void {
  try {
    window.sessionStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    // Nada a limpar se o storage está bloqueado.
  }
}

/**
 * Dispara `onIdle` depois de {@link IDLE_TIMEOUT_MINUTES} sem interação.
 *
 * O `setTimeout` sozinho não basta: navegadores estrangulam timers em abas
 * ocultas. Por isso o tempo decorrido é reconferido sempre que a aba volta a
 * ficar visível ou recebe foco — se o limite já passou, expira na hora.
 */
export function useIdleLogout(enabled: boolean, onIdle: () => void): void {
  const handleIdle = useEffectEvent(onIdle);

  useEffect(() => {
    if (!enabled) return;

    let lastActivity = readLastActivity() ?? Date.now();
    let lastWrite = 0;
    let timer: number | undefined;

    const expire = () => {
      window.clearTimeout(timer);
      clearLastActivity();
      handleIdle();
    };

    const schedule = () => {
      window.clearTimeout(timer);
      const remaining = lastActivity + IDLE_TIMEOUT_MS - Date.now();
      if (remaining <= 0) {
        expire();
        return;
      }
      timer = window.setTimeout(expire, remaining);
    };

    const markActive = () => {
      lastActivity = Date.now();
      if (lastActivity - lastWrite >= WRITE_INTERVAL_MS) {
        lastWrite = lastActivity;
        writeLastActivity(lastActivity);
      }
      schedule();
    };

    const recheck = () => {
      if (document.visibilityState === "visible") schedule();
    };

    writeLastActivity(lastActivity);
    lastWrite = lastActivity;
    schedule();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, markActive, { passive: true });
    }
    document.addEventListener("visibilitychange", recheck);
    window.addEventListener("focus", recheck);

    return () => {
      window.clearTimeout(timer);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, markActive);
      }
      document.removeEventListener("visibilitychange", recheck);
      window.removeEventListener("focus", recheck);
      // A sessão acabou (logout/expiração): o próximo login começa do zero.
      // Um reload não passa por aqui, então o contador sobrevive à recarga.
      clearLastActivity();
    };
  }, [enabled]);
}
