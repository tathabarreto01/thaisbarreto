"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { CategoryId, Prospect } from "@/lib/types";
import { ProspectsProvider, useProspects } from "@/lib/store";
import { AuthProvider, useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ProspectForm } from "./prospect-form";
import { ProspectDetail } from "./prospect-detail";
import { LoginScreen } from "./login-screen";
import { ConfirmDialog } from "./ui";

const CLOUD = isSupabaseConfigured();

/* ---------- Global form controller ---------- */
interface FormCtx {
  openCreate: (preset?: { category?: CategoryId; subcategory?: string }) => void;
  openEdit: (prospect: Prospect) => void;
  openDetail: (prospect: Prospect) => void;
}
const FormController = createContext<FormCtx | null>(null);
export function useProspectForm() {
  const ctx = useContext(FormController);
  if (!ctx) throw new Error("useProspectForm fora do AppShell");
  return ctx;
}

const NAV = [
  { href: "/", label: "Painel", icon: "◱" },
  { href: "/mapa", label: "Mapa", icon: "🗺" },
  { href: "/prospectos", label: "Prospectos", icon: "☰" },
  { href: "/top5", label: "Meus 5", icon: "★" },
  { href: "/desafio", label: "Desafio", icon: "◎" },
  { href: "/imprimir", label: "Imprimir", icon: "⎙" },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-2xl text-white shadow-lg" style={{ background: "linear-gradient(135deg,#2563eb,#60a5fa)", boxShadow: "0 10px 22px -8px rgba(37,99,235,.8)" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3l6 2 5-2v14l-5 2-6-2-5 2V5l5-2z" /><path d="M9 3v16M15 5v16" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block font-display text-[15px] font-extrabold text-ink">Mapa de <span className="text-gradient">Prospectos</span></span>
        <span className="block text-[11px] font-semibold text-ink-faint">Sua próxima oportunidade</span>
      </span>
    </Link>
  );
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="stagger flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all"
            style={{
              background: active ? "linear-gradient(135deg,rgba(37,99,235,.14),rgba(96,165,250,.14))" : "transparent",
              color: active ? "var(--brand-700)" : "var(--ink-soft)",
              boxShadow: active ? "inset 0 0 0 1px rgba(37,99,235,.18)" : "none",
            }}
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg text-[13px] transition-all" style={{ background: active ? "rgba(37,99,235,.16)" : "rgba(255,255,255,.6)", color: active ? "var(--brand-700)" : "var(--ink-faint)" }}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const { createProspect, updateProspect, prospects, reset } = useProspects();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Prospect | null>(null);
  const [preset, setPreset] = useState<{ category?: CategoryId; subcategory?: string }>();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const openCreate = useCallback((p?: { category?: CategoryId; subcategory?: string }) => {
    setDetailId(null);
    setEditing(null);
    setPreset(p);
    setFormOpen(true);
  }, []);
  const openEdit = useCallback((prospect: Prospect) => {
    setDetailId(null);
    setEditing(prospect);
    setPreset(undefined);
    setFormOpen(true);
  }, []);
  const openDetail = useCallback((prospect: Prospect) => {
    setFormOpen(false);
    setDetailId(prospect.id);
  }, []);

  // Resolve the detail target from live state so favorite/history changes reflect instantly.
  const detailProspect = useMemo(
    () => prospects.find((p) => p.id === detailId) ?? null,
    [prospects, detailId],
  );

  const ctx = useMemo<FormCtx>(
    () => ({ openCreate, openEdit, openDetail }),
    [openCreate, openEdit, openDetail],
  );

  return (
    <FormController.Provider value={ctx}>
      <div className="relative z-10 flex min-h-dvh">
        {/* Sidebar (desktop) */}
        <aside className="no-print sticky top-0 hidden h-dvh w-[268px] shrink-0 flex-col gap-6 p-4 lg:flex">
          <div className="glass flex h-full flex-col gap-6 p-4">
            <div className="px-1 pt-1"><Brand /></div>
            <button className="btn btn-primary w-full" onClick={() => openCreate()}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Novo prospecto
            </button>
            <NavItems />
            <SidebarFooter
              empty={prospects.length === 0}
              onClear={() => setConfirmReset(true)}
            />
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar + menu dropdown (mobile) */}
          <div className="no-print sticky top-0 z-30 lg:hidden">
            {mobileNav && (
              <div className="fixed inset-0 bg-[#0b1c3f]/30 backdrop-blur-sm" onClick={() => setMobileNav(false)} />
            )}
            <div className="p-3">
              <div className="relative">
                <div className="glass flex w-full items-center justify-between gap-3 px-3 py-2.5">
                  <Brand />
                  <button
                    className="btn btn-ghost !px-2.5 !py-2"
                    onClick={() => setMobileNav((v) => !v)}
                    aria-label={mobileNav ? "Fechar menu" : "Abrir menu"}
                    aria-expanded={mobileNav}
                  >
                    {mobileNav ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                    )}
                  </button>
                </div>
                {mobileNav && (
                  <div className="glass-strong absolute left-0 right-0 top-full z-10 mt-2 p-3" style={{ animation: "floatUp .3s ease" }}>
                    <button className="btn btn-primary mb-2 w-full" onClick={() => { setMobileNav(false); openCreate(); }}>+ Novo prospecto</button>
                    <NavItems onNavigate={() => setMobileNav(false)} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <main className="flex-1 px-3 pb-16 pt-1 sm:px-5 lg:px-8 lg:pt-6">{children}</main>
        </div>
      </div>

      <ProspectForm
        open={formOpen}
        editing={editing}
        preset={preset}
        onClose={() => setFormOpen(false)}
        onCreate={createProspect}
        onUpdate={updateProspect}
      />

      <ProspectDetail
        open={detailId !== null}
        prospect={detailProspect}
        onClose={() => setDetailId(null)}
        onEdit={(p) => { setDetailId(null); openEdit(p); }}
      />

      <ConfirmDialog
        open={confirmReset}
        danger
        title="Limpar todos os dados?"
        message="Todos os prospectos deste navegador serão apagados. Essa ação não pode ser desfeita."
        confirmLabel="Limpar tudo"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => { reset(); setConfirmReset(false); }}
      />
    </FormController.Provider>
  );
}

function SidebarFooter({ empty, onClear }: { empty: boolean; onClear: () => void }) {
  const auth = useAuth();
  return (
    <div className="mt-auto flex flex-col gap-2 rounded-xl px-3 py-3 text-[11px] leading-relaxed text-ink-faint" style={{ background: "rgba(255,255,255,.4)" }}>
      {CLOUD ? (
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white" style={{ background: "linear-gradient(135deg,#2563eb,#60a5fa)" }}>
            {(auth.user?.email?.[0] ?? "?").toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 truncate font-semibold text-ink-soft" title={auth.user?.email ?? ""}>{auth.user?.email ?? "Conectado"}</span>
          <button className="btn btn-ghost !px-2 !py-1 !text-[11px]" onClick={() => auth.signOut()} title="Sair">Sair</button>
        </div>
      ) : (
        <span>💾 Dados salvos neste navegador. Modo local (sem login).</span>
      )}
      {!empty && (
        <button className="btn btn-ghost !py-1 !text-[11px]" onClick={onClear}>🗑 Limpar todos os dados</button>
      )}
    </div>
  );
}

function FullSplash() {
  return (
    <div className="relative z-10 grid min-h-dvh place-items-center">
      <div className="flex flex-col items-center gap-4">
        <span className="grid h-14 w-14 animate-pulse place-items-center rounded-2xl text-white" style={{ background: "linear-gradient(135deg,#2563eb,#60a5fa)" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3l6 2 5-2v14l-5 2-6-2-5 2V5l5-2z" /><path d="M9 3v16M15 5v16" /></svg>
        </span>
        <span className="text-sm font-semibold text-ink-faint">Carregando…</span>
      </div>
    </div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, session } = useAuth();
  if (CLOUD) {
    if (loading) return <FullSplash />;
    if (!session) return <LoginScreen />;
  }
  return (
    <ProspectsProvider>
      <ShellInner>{children}</ShellInner>
    </ProspectsProvider>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}
