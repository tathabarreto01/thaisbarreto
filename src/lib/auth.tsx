"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/auth-js";
import { getAuth, isSupabaseConfigured } from "./supabase";
import { useIdleLogout } from "./use-idle-logout";

/** `"idle"` = a sessão caiu sozinha por inatividade (o logout manual não marca nada). */
export type SignedOutReason = "idle" | null;

interface AuthValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  signedOutReason: SignedOutReason;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string; needsConfirm?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Sem Supabase (modo local) não há sessão a carregar: já começa pronto.
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [signedOutReason, setSignedOutReason] = useState<SignedOutReason>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const auth = getAuth();
    auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const expireByIdle = useCallback(async () => {
    await getAuth().signOut();
    setSession(null);
    setSignedOutReason("idle");
  }, []);

  useIdleLogout(session !== null, expireByIdle);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await getAuth().signInWithPassword({ email, password });
    if (!error) setSignedOutReason(null);
    return { error: error?.message };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await getAuth().signUp({ email, password });
    if (error) return { error: error.message };
    setSignedOutReason(null);
    // If email confirmation is on, there's a user but no active session.
    const needsConfirm = !data.session && !!data.user;
    return { needsConfirm };
  }, []);

  const signOut = useCallback(async () => {
    await getAuth().signOut();
    setSession(null);
    setSignedOutReason(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      signedOutReason,
      signIn,
      signUp,
      signOut,
    }),
    [loading, session, signedOutReason, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
