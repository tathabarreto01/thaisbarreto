"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { GlassCard } from "./ui";

export function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await signIn(email.trim(), password);
        if (error) setError(traduzir(error));
      } else {
        const { error, needsConfirm } = await signUp(email.trim(), password);
        if (error) setError(traduzir(error));
        else if (needsConfirm) setInfo("Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre.");
        else setInfo("Conta criada! Você já pode entrar.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative z-10 grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center reveal">
          <span className="grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg" style={{ background: "linear-gradient(135deg,#2563eb,#60a5fa)", boxShadow: "0 14px 30px -10px rgba(37,99,235,.85)" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3l6 2 5-2v14l-5 2-6-2-5 2V5l5-2z" /><path d="M9 3v16M15 5v16" /></svg>
          </span>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink">Mapa de <span className="text-gradient">Prospectos</span></h1>
            <p className="font-hand text-xl text-brand-500">Sua próxima oportunidade começa aqui.</p>
          </div>
        </div>

        <GlassCard strong className="reveal p-6 sm:p-7">
          <h2 className="font-display text-lg font-bold text-ink">{mode === "in" ? "Entrar na sua conta" : "Criar sua conta"}</h2>
          <p className="mt-1 text-sm text-ink-soft">{mode === "in" ? "Acesse seus prospectos de qualquer dispositivo." : "Leva menos de um minuto."}</p>

          <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
            <div>
              <label className="label">E-mail</label>
              <input className="field" type="email" autoComplete="email" required placeholder="voce@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Senha</label>
              <input className="field" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} required minLength={6} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {error && <div className="rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(254,226,226,.8)", color: "#b91c1c" }}>{error}</div>}
            {info && <div className="rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(220,252,231,.85)", color: "#15803d" }}>{info}</div>}

            <button className="btn btn-primary w-full" type="submit" disabled={busy}>
              {busy ? "Aguarde…" : mode === "in" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-ink-soft">
            {mode === "in" ? (
              <>Ainda não tem conta?{" "}
                <button className="font-semibold text-brand-600 hover:underline" onClick={() => { setMode("up"); setError(null); setInfo(null); }}>Criar agora</button>
              </>
            ) : (
              <>Já tem conta?{" "}
                <button className="font-semibold text-brand-600 hover:underline" onClick={() => { setMode("in"); setError(null); setInfo(null); }}>Entrar</button>
              </>
            )}
          </div>
        </GlassCard>

        <p className="mt-4 text-center text-xs text-ink-faint reveal">🔒 Seus dados ficam protegidos por regras de acesso — só você vê seus prospectos.</p>
      </div>
    </div>
  );
}

function traduzir(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Este e-mail já está cadastrado. Tente entrar.";
  if (m.includes("password should be at least")) return "A senha deve ter pelo menos 6 caracteres.";
  if (m.includes("unable to validate email")) return "E-mail inválido.";
  return msg;
}
