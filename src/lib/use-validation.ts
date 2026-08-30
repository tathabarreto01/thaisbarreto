"use client";

import { useEffect, useEffectEvent, useState } from "react";

/**
 * Estado de uma validação assistiva de campo.
 * - `idle`    → desabilitada, vazia ou sem resultado utilizável.
 * - `loading` → aguardando o debounce ou a resposta da API.
 * - `done`    → resposta recebida (guardada em `data`).
 */
export type ValidationState<T> =
  | { status: "idle"; data: null }
  | { status: "loading"; data: null }
  | { status: "done"; data: T };

interface Options<T> {
  /** Valor atual do campo (dispara nova busca a cada mudança). */
  value: string;
  /** Só busca quando `true` (ex.: campo não vazio / mínimo de caracteres). */
  enabled: boolean;
  /** Atraso do debounce em ms. */
  delay?: number;
  /** Faz a requisição; recebe um `AbortSignal` para cancelamento. */
  fetcher: (value: string, signal: AbortSignal) => Promise<T>;
}

const IDLE = { status: "idle", data: null } as const;
const LOADING = { status: "loading", data: null } as const;

/** Última resposta recebida, marcada com o valor que a originou. */
interface Settled<T> {
  value: string;
  /** `null` quando a requisição falhou (volta ao estado neutro). */
  data: T | null;
}

/**
 * Busca de validação com debounce e proteção contra corrida de requisições.
 * Cada mudança de `value` cancela o timer e a requisição anterior via
 * `AbortController`, garantindo que apenas a resposta mais recente vença.
 *
 * O estado visível é derivado: enquanto a resposta guardada não corresponder ao
 * `value` atual, o campo está em `loading` — assim nada precisa ser escrito no
 * estado durante o efeito.
 */
export function useDebouncedValidation<T>({
  value,
  enabled,
  delay = 450,
  fetcher,
}: Options<T>): ValidationState<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  // Mantém o fetcher fora das dependências do efeito (fetchers são puros por URL).
  const runFetch = useEffectEvent((v: string, signal: AbortSignal) => fetcher(v, signal));

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      runFetch(value, controller.signal)
        .then((data) => {
          if (controller.signal.aborted) return;
          setSettled({ value, data });
        })
        .catch(() => {
          // Erro de rede ou requisição abortada: volta ao estado neutro.
          if (controller.signal.aborted) return;
          setSettled({ value, data: null });
        });
    }, delay);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, enabled, delay]);

  if (!enabled) return IDLE;
  if (!settled || settled.value !== value) return LOADING;
  return settled.data === null ? IDLE : { status: "done", data: settled.data };
}
