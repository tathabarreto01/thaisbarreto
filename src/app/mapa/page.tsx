"use client";

import { useMemo } from "react";
import { useProspects } from "@/lib/store";
import { CATEGORIES } from "@/lib/taxonomy";
import type { Prospect } from "@/lib/types";
import { GlassCard } from "@/components/ui";
import { useProspectForm } from "@/components/shell";
import { LoadingScreen } from "../page";

export default function MapaPage() {
  const { ready, prospects } = useProspects();
  const { openCreate, openDetail } = useProspectForm();

  const byKey = useMemo(() => {
    const map = new Map<string, Prospect[]>();
    for (const p of prospects) {
      const key = `${p.category}::${p.subcategory}`;
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return map;
  }, [prospects]);

  if (!ready) return <LoadingScreen />;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 pb-6">
      <header className="reveal pt-2">
        <p className="font-hand text-2xl text-brand-500">Anote o nome de todas as pessoas que você lembrar.</p>
        <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">Mapa de Prospectos</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">Percorra cada grupo abaixo e registre as pessoas que vierem à mente. Quantos mais nomes, mais oportunidades.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {CATEGORIES.map((cat, ci) => {
          const total = prospects.filter((p) => p.category === cat.id).length;
          return (
            <GlassCard key={cat.id} className="reveal flex flex-col p-5" style={{ animationDelay: `${ci * 60}ms` }}>
              <div className="mb-1 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl text-2xl" style={{ background: "rgba(37,99,235,.1)" }}>{cat.icon}</span>
                <div className="flex-1">
                  <h2 className="font-display text-lg font-bold text-ink">{cat.label}</h2>
                  <p className="text-xs text-ink-faint">{cat.hint}</p>
                </div>
                <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-700">{total}</span>
              </div>

              <div className="mt-3 flex flex-col divide-y divide-white/60">
                {cat.subcategories.map((sub) => {
                  const list = byKey.get(`${cat.id}::${sub}`) ?? [];
                  return (
                    <div key={sub} className="flex flex-wrap items-center gap-2 py-2.5">
                      <span className="w-full text-xs font-bold uppercase tracking-wide text-brand-700 sm:w-40 sm:shrink-0">{sub}</span>
                      <div className="flex flex-1 flex-wrap items-center gap-1.5">
                        {list.map((p) => (
                          <button key={p.id} onClick={() => openDetail(p)} className="chip transition-all hover:scale-105" style={{ background: "rgba(255,255,255,.7)", borderColor: "rgba(37,99,235,.18)", color: "var(--ink)" }}>
                            {p.favorite && <span className="text-amber-500">★</span>}
                            {p.name}
                          </button>
                        ))}
                        <button onClick={() => openCreate({ category: cat.id, subcategory: sub })} className="chip transition-all hover:scale-105" style={{ background: "rgba(37,99,235,.08)", borderColor: "rgba(37,99,235,.25)", color: "var(--brand-700)", fontWeight: 700 }}>
                          + adicionar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
