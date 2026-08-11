"use client";

import { useEffect, useRef, useState } from "react";

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

/**
 * Busca de validação com debounce e proteção contra corrida de requisições.
 * Cada mudança de `value` cancela o timer e a requisição anterior via
 * `AbortController`, garantindo que apenas a resposta mais recente vença.
 */
export function useDebouncedValidation<T>({
  value,
  enabled,
  delay = 450,
  fetcher,
}: Options<T>): ValidationState<T> {
  const [state, setState] = useState<ValidationState<T>>({ status: "idle", data: null });

  // Mantém o fetcher fora das dependências do efeito (fetchers são puros por URL).
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) {
      setState({ status: "idle", data: null });
      return;
    }

    const controller = new AbortController();
    setState({ status: "loading", data: null });

    const timer = setTimeout(() => {
      fetcherRef
        .current(value, controller.signal)
        .then((data) => {
          if (controller.signal.aborted) return;
          setState({ status: "done", data });
        })
        .catch(() => {
          // Erro de rede ou requisição abortada: volta ao estado neutro.
          if (controller.signal.aborted) return;
          setState({ status: "idle", data: null });
        });
    }, delay);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, enabled, delay]);

  return state;
}
