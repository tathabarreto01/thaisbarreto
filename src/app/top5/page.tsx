"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useProspects } from "@/lib/store";
import { INTIMACY, MOTIVATION_OTHER, getIntimacyDef } from "@/lib/taxonomy";
import type { Prospect } from "@/lib/types";
import { GlassCard, EmptyState, IntimacyDots, StarRating } from "@/components/ui";
import { useProspectForm } from "@/components/shell";
import { LoadingScreen } from "../page";

function motivationsList(p: Prospect): string[] {
  const parts = [...(p.motivations ?? [])];
  if (p.motivations?.includes(MOTIVATION_OTHER) && p.interestNotes) {
    parts.push(p.interestNotes);
  }
  return parts;
}

export default function Top5Page() {
  const { ready, prospects, updateProspect, toggleFavorite } = useProspects();
  const { openEdit, openDetail } = useProspectForm();

  const favorites = useMemo(
    () => prospects.filter((p) => p.favorite).sort((a, b) => b.interest - a.interest),
    [prospects],
  );

  if (!ready) return <LoadingScreen />;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 pb-6">
      <header className="reveal pt-2">
        <p className="font-hand text-2xl text-brand-500">Escolha por onde começar.</p>
        <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">Meus 5 principais</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">Marque com a estrela ⭐ os prospectos mais promissores. Defina o interesse e o próximo passo de cada um.</p>
      </header>

      {/* Intimacy legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-ink-soft">
        <span className="text-ink-faint">Nível de intimidade:</span>
        {INTIMACY.map((i) => (
          <span key={i.id} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full" style={{ border: `2px solid ${i.color}`, background: i.color }} />{i.label}
          </span>
        ))}
      </div>

      {favorites.length === 0 ? (
        <EmptyState icon="⭐" title="Nenhum principal marcado" message="Vá em Prospectos e toque na estrela para eleger seus 5 principais." action={<Link href="/prospectos" className="btn btn-primary">Ver prospectos</Link>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {favorites.map((p, idx) => {
            const motivations = motivationsList(p);
            return (
              <GlassCard key={p.id} hover className="reveal flex flex-col gap-3.5 p-4">
                {/* Ranking + name */}
                <div className="flex items-center gap-2.5">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-xl font-display text-sm font-extrabold text-white"
                    style={{ background: "linear-gradient(135deg,#1e40af,#2563eb)" }}
                  >
                    {idx + 1}
                  </span>
                  <button
                    onClick={() => openDetail(p)}
                    className="min-w-0 flex-1 truncate text-left font-display text-lg font-bold text-ink hover:text-brand-700"
                  >
                    {p.name}
                  </button>
                  <button
                    onClick={() => toggleFavorite(p.id)}
                    title="Remover dos principais"
                    aria-label="Remover dos principais"
                    className="shrink-0 rounded-lg px-1 text-lg transition-transform hover:scale-110"
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                  >
                    ⭐
                  </button>
                </div>

                {/* Intimacy + interest */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Intimidade</span>
                    <span className="flex items-center gap-2">
                      <IntimacyDots value={p.intimacy} />
                      <span className="text-xs font-semibold text-ink-soft">{getIntimacyDef(p.intimacy).label}</span>
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Interesse</span>
                    <StarRating value={p.interest} size={20} onChange={(v) => updateProspect(p.id, { interest: v })} />
                  </div>
                </div>

                {/* Motivations */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Fatores de motivação</span>
                  {motivations.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {motivations.map((m, i) => (
                        <span
                          key={`${m}-${i}`}
                          className="chip"
                          style={{ background: "rgba(219,234,254,.7)", color: "var(--brand-700, #1d4ed8)", borderColor: "rgba(37,99,235,.2)" }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-ink-faint">—</span>
                  )}
                </div>

                {/* Next step */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Próximo passo</span>
                  <span className="text-sm text-ink-soft">{p.nextStep || <span className="text-ink-faint">—</span>}</span>
                </div>

                {/* Footer */}
                <div className="mt-auto flex justify-end border-t border-white/60 pt-3">
                  <button onClick={() => openEdit(p)} className="btn btn-ghost !px-3 !py-1.5 !text-xs no-print">Editar</button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {favorites.length > 0 && favorites.length < 5 && (
        <p className="text-center text-sm text-ink-faint">Você marcou {favorites.length} de 5. <Link href="/prospectos" className="font-semibold text-brand-600 hover:underline">Marcar mais →</Link></p>
      )}
    </div>
  );
}
