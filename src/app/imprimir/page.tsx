"use client";

import { useMemo } from "react";
import { useProspects } from "@/lib/store";
import { CATEGORIES, INTIMACY_MAP } from "@/lib/taxonomy";
import type { Prospect } from "@/lib/types";
import { GlassCard } from "@/components/ui";
import { downloadCSV } from "@/lib/export";
import { LoadingScreen } from "../page";

export default function ImprimirPage() {
  const { ready, prospects } = useProspects();

  const byKey = useMemo(() => {
    const map = new Map<string, Prospect[]>();
    for (const p of prospects) {
      const key = `${p.category}::${p.subcategory}`;
      map.set(key, [...(map.get(key) ?? []), p]);
    }
    return map;
  }, [prospects]);

  const favorites = useMemo(() => prospects.filter((p) => p.favorite).slice(0, 5), [prospects]);

  if (!ready) return <LoadingScreen />;

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <header className="no-print reveal mb-4 flex flex-col justify-between gap-3 pt-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Imprimir / Exportar</h1>
          <p className="text-sm text-ink-soft">Gere um PDF (via impressão) ou baixe uma planilha CSV.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => downloadCSV(prospects)} disabled={!prospects.length}>⬇ CSV</button>
          <button className="btn btn-primary" onClick={() => window.print()}>⎙ Imprimir / PDF</button>
        </div>
      </header>

      {/* Printable sheet */}
      <GlassCard strong className="print-page p-6 sm:p-8">
        <div className="mb-5 flex items-start justify-between border-b border-brand-200 pb-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-ink">Mapa de <span className="text-gradient">Prospectos</span></h2>
            <p className="font-hand text-lg text-brand-500">Sua próxima oportunidade pode estar mais perto do que você pensa.</p>
          </div>
          <div className="text-right text-xs text-ink-faint">
            <p>{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
            <p className="font-bold text-brand-700">{prospects.length} prospectos</p>
          </div>
        </div>

        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {CATEGORIES.map((cat) => (
            <section key={cat.id} className="break-inside-avoid">
              <h3 className="mb-1.5 font-display text-sm font-bold uppercase tracking-wide text-brand-700">{cat.icon} {cat.label}</h3>
              <div className="flex flex-col gap-1.5">
                {cat.subcategories.map((sub) => {
                  const list = byKey.get(`${cat.id}::${sub}`) ?? [];
                  return (
                    <div key={sub} className="flex gap-2 text-sm leading-tight">
                      <span className="shrink-0 font-semibold text-ink-soft">• {sub}:</span>
                      <span className="flex-1 border-b border-dotted border-brand-200 text-ink">{list.map((p) => p.name).join(", ")}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Top 5 */}
        <div className="mt-7 break-inside-avoid">
          <div className="mb-2 inline-block rounded-lg px-4 py-1.5 font-hand text-lg text-white" style={{ background: "linear-gradient(135deg,#1e40af,#2563eb)" }}>Meus 5 principais</div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left" style={{ background: "rgba(37,99,235,.08)" }}>
                <th className="border border-brand-200 px-2 py-1.5 font-bold">Nome</th>
                <th className="border border-brand-200 px-2 py-1.5 font-bold">Intimidade</th>
                <th className="border border-brand-200 px-2 py-1.5 font-bold">Interesse</th>
                <th className="border border-brand-200 px-2 py-1.5 font-bold">Pode se interessar por</th>
                <th className="border border-brand-200 px-2 py-1.5 font-bold">Próximo passo</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.max(5, favorites.length) }).map((_, i) => {
                const p = favorites[i];
                return (
                  <tr key={i}>
                    <td className="border border-brand-200 px-2 py-2 font-semibold text-ink">{p ? `${i + 1}. ${p.name}` : `${i + 1}.`}</td>
                    <td className="border border-brand-200 px-2 py-2 text-ink-soft">{p ? INTIMACY_MAP[p.intimacy].label : ""}</td>
                    <td className="border border-brand-200 px-2 py-2 text-amber-500">{p ? "★".repeat(p.interest) + "☆".repeat(5 - p.interest) : "☆☆☆☆☆"}</td>
                    <td className="border border-brand-200 px-2 py-2 text-ink-soft">{p?.interestNotes ?? ""}</td>
                    <td className="border border-brand-200 px-2 py-2 text-ink-soft">{p?.nextStep ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
