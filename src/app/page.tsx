"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProspects } from "@/lib/store";
import { computeStats, registeredThisWeek } from "@/lib/derive";
import { CATEGORY_MAP, INTEREST_LABELS } from "@/lib/taxonomy";
import { GlassCard, ProgressRing, StatusBadge, EmptyState } from "@/components/ui";
import { useProspectForm } from "@/components/shell";

export default function DashboardPage() {
  const { ready, prospects, challenge } = useProspects();
  const { openCreate } = useProspectForm();
  const stats = useMemo(() => computeStats(prospects), [prospects]);
  const doneWeek = registeredThisWeek(prospects);

  const upcoming = useMemo(
    () =>
      prospects
        .filter((p) => p.nextStep && p.nextStepDate)
        .sort((a, b) => (a.nextStepDate! < b.nextStepDate! ? -1 : 1))
        .slice(0, 5),
    [prospects],
  );

  const maxCat = Math.max(1, ...stats.byCategory.map((c) => c.count));

  if (!ready) return <LoadingScreen />;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 pb-6">
      {/* Hero */}
      <header className="reveal flex flex-col justify-between gap-4 pt-2 sm:flex-row sm:items-end">
        <div>
          <p className="font-hand text-2xl text-brand-500">Sua próxima oportunidade pode estar mais perto do que você pensa.</p>
          <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">Painel</h1>
        </div>
        <button className="btn btn-primary self-start sm:self-auto" onClick={() => openCreate()}>+ Registrar prospecto</button>
      </header>

      {/* Stat tiles */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Prospectos" value={stats.total} icon="👥" tone="#2563eb" />
        <StatTile label="Meus 5 principais" value={stats.favorites} icon="⭐" tone="#f59e0b" />
        <StatTile label="Muito interessados" value={stats.hot} icon="🔥" tone="#ef4444" />
        <StatTile label="Com próximo passo" value={stats.withNextStep} icon="🎯" tone="#0891b2" />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Weekly challenge */}
        <GlassCard className="reveal flex items-center gap-4 p-5">
          <ProgressRing value={doneWeek} max={challenge?.goalCount ?? 15} label={`${doneWeek}`} sub={`de ${challenge?.goalCount ?? 15}`} />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Desafio da semana {challenge?.week ?? 1}</p>
            <p className="mt-1 text-sm text-ink-soft">Você registrou <b className="text-ink">{doneWeek}</b> prospectos esta semana.</p>
            <Link href="/desafio" className="btn btn-ghost mt-2 !py-1.5 !text-xs">Ver desafio →</Link>
          </div>
        </GlassCard>

        {/* Category distribution */}
        <GlassCard className="reveal p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display font-bold text-ink">Onde estão seus prospectos</h2>
            <Link href="/mapa" className="text-xs font-semibold text-brand-600 hover:underline">Abrir mapa →</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            {stats.byCategory.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-sm font-semibold text-ink-soft"><span className="mr-1">{c.icon}</span>{c.label}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-brand-100/70">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(c.count / maxCat) * 100}%`, minWidth: c.count ? 8 : 0, background: "linear-gradient(90deg,#2563eb,#60a5fa)" }} />
                </div>
                <span className="w-7 text-right text-sm font-bold text-ink">{c.count}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Funnel */}
        <GlassCard className="reveal p-5 lg:col-span-2">
          <h2 className="mb-3 font-display font-bold text-ink">Funil</h2>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
            {stats.byStatus.map((s) => (
              <div key={s.id} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,.5)" }}>
                <div className="font-display text-2xl font-extrabold" style={{ color: s.color }}>{s.count}</div>
                <div className="mt-0.5 text-[11px] font-semibold text-ink-faint">{s.label}</div>
              </div>
            ))}
          </div>
          <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-brand-700">Por nível de interesse</h3>
          <div className="flex items-end gap-2" style={{ height: 90 }}>
            {stats.byInterest.map((count, n) => {
              const max = Math.max(1, ...stats.byInterest);
              return (
                <div key={n} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[11px] font-bold text-ink">{count || ""}</span>
                  <div className="w-full rounded-t-md transition-all" style={{ height: `${(count / max) * 64 + 4}px`, background: n >= 4 ? "linear-gradient(180deg,#f59e0b,#fbbf24)" : "linear-gradient(180deg,#60a5fa,#93c5fd)" }} title={`${count}`} />
                  <span className="text-[10px] text-ink-faint">{n}★</span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Upcoming next steps */}
        <GlassCard className="reveal p-5">
          <h2 className="mb-3 font-display font-bold text-ink">Próximas ações</h2>
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-faint">Nenhum próximo passo agendado ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {upcoming.map((p) => (
                <li key={p.id} className="rounded-xl bg-white/50 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-ink">{p.name}</span>
                    <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">{new Date(p.nextStepDate!).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-soft">→ {p.nextStep}</p>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>

      {/* Recent */}
      <GlassCard className="reveal p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display font-bold text-ink">Adicionados recentemente</h2>
          <Link href="/prospectos" className="text-xs font-semibold text-brand-600 hover:underline">Ver todos →</Link>
        </div>
        {prospects.length === 0 ? (
          <EmptyState title="Comece seu mapa" message="Registre as pessoas que você lembrar — família, amigos, redes sociais, comunidade e trabalho." action={<button className="btn btn-primary" onClick={() => openCreate()}>+ Adicionar o primeiro</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-ink-faint">
                  <th className="pb-2 font-bold">Nome</th>
                  <th className="pb-2 font-bold">Categoria</th>
                  <th className="pb-2 font-bold">Interesse</th>
                  <th className="pb-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {prospects.slice(0, 6).map((p) => (
                  <tr key={p.id} className="border-t border-white/60">
                    <td className="py-2.5 font-semibold text-ink">{p.favorite && <span className="mr-1 text-amber-500">★</span>}{p.name}</td>
                    <td className="py-2.5 text-ink-soft">{CATEGORY_MAP[p.category].icon} {CATEGORY_MAP[p.category].label}</td>
                    <td className="py-2.5 text-ink-soft">{p.interest > 0 ? `${p.interest}★ · ${INTEREST_LABELS[p.interest - 1]}` : "—"}</td>
                    <td className="py-2.5"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function StatTile({ label, value, icon, tone }: { label: string; value: number; icon: string; tone: string }) {
  return (
    <GlassCard hover className="reveal flex items-center gap-3 p-4">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl" style={{ background: `${tone}18` }}>{icon}</div>
      <div>
        <div className="font-display text-2xl font-extrabold leading-none text-ink">{value}</div>
        <div className="mt-1 text-xs font-semibold text-ink-faint">{label}</div>
      </div>
    </GlassCard>
  );
}

export function LoadingScreen() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid grid-cols-2 gap-3 pt-8 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass shimmer h-20" />)}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="glass shimmer h-40" />
        <div className="glass shimmer h-40 lg:col-span-2" />
      </div>
    </div>
  );
}
