import { AuthClient, type GoTrueClient, type SupportedStorage } from "@supabase/auth-js";
import { PostgrestClient } from "@supabase/postgrest-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when the app is wired to a real Supabase project (cloud + login mode). */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

/**
 * We compose the two Supabase modules the app actually uses (auth + PostgREST)
 * instead of the `@supabase/supabase-js` umbrella package, which also pulls in
 * realtime (WebSocket/phoenix), storage and edge functions — none of which this
 * app ever calls, yet all of which are eagerly instantiated by `SupabaseClient`
 * and therefore impossible to tree-shake.
 *
 * The wiring below mirrors `SupabaseClient` 1:1, in particular the `storageKey`
 * (`sb-<project-ref>-auth-token`), so existing browser sessions keep working.
 */
interface Clients {
  auth: GoTrueClient;
  db: PostgrestClient;
}

let clients: Clients | null = null;

/**
 * The session lives in `sessionStorage`, not in auth-js's default `localStorage`:
 * `sessionStorage` is scoped to the tab, so closing the tab/window logs the user
 * out, while a reload in the same tab keeps them signed in.
 *
 * Every access is guarded because storage throws in private mode / when the
 * browser blocks site data; failing to read just means "no session".
 */
const tabStorage: SupportedStorage = {
  getItem(key) {
    if (typeof window === "undefined") return null;
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      // Storage indisponível: a sessão vive só em memória nesta aba.
    }
  },
  removeItem(key) {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Nada a limpar se o storage está bloqueado.
    }
  },
};

/** Drops sessions written by previous versions, which persisted in localStorage. */
function purgeLegacyLocalSession(storageKey: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem(`${storageKey}-code-verifier`);
  } catch {
    // Storage bloqueado: não há legado a remover.
  }
}

function createClients(): Clients {
  const baseUrl = new URL(url as string);
  const key = anonKey as string;
  const storageKey = `sb-${baseUrl.hostname.split(".")[0]}-auth-token`;

  purgeLegacyLocalSession(storageKey);

  const auth = new AuthClient({
    url: new URL("auth/v1", baseUrl).href,
    headers: { Authorization: `Bearer ${key}`, apikey: key },
    storageKey,
    storage: tabStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "implicit",
  });

  // PostgREST needs the logged-in user's JWT so RLS scopes rows to them.
  // Reading it through `getSession()` on every request also refreshes it when
  // it is close to expiring — same behaviour as supabase-js's `fetchWithAuth`.
  const fetchWithAuth: typeof fetch = async (input, init) => {
    const { data } = await auth.getSession();
    const headers = new Headers(init?.headers);
    if (!headers.has("apikey")) headers.set("apikey", key);
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${data.session?.access_token ?? key}`);
    }
    return fetch(input, { ...init, headers });
  };

  const db = new PostgrestClient(new URL("rest/v1", baseUrl).href, {
    schema: "public",
    fetch: fetchWithAuth,
  });

  return { auth, db };
}

function getClients(): Clients {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  if (!clients) clients = createClients();
  return clients;
}

/** Auth client (singleton). Persists the session in sessionStorage (per tab). */
export function getAuth(): GoTrueClient {
  return getClients().auth;
}

/** PostgREST client (singleton), authenticated as the logged-in user. */
export function getDb(): PostgrestClient {
  return getClients().db;
}
