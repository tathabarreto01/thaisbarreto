"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useProspects } from "@/lib/store";
import { INTIMACY, MOTIVATION_OTHER } from "@/lib/taxonomy";
import type { Prospect } from "@/lib/types";
import { GlassCard, EmptyState, IntimacyDots, StarRating } from "@/components/ui";
import { useProspectForm } from "@/components/shell";
import { LoadingScreen } from "../page";

function motivationsText(p: Prospect, sep = " · "): string {
  const parts = [...(p.motivations ?? [])];
  if (p.motivations?.includes(MOTIVATION_OTHER) && p.interestNotes) {
    parts.push(p.interestNotes);
  }
  return parts.join(sep);
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
        <GlassCard strong className="reveal overflow-hidden p-0">
          {/* header row */}
          <div className="hidden grid-cols-[1.4fr_0.9fr_1fr_1.6fr_1.4fr] gap-3 px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-white md:grid" style={{ background: "linear-gradient(135deg,#1e40af,#2563eb)" }}>
            <span>Nome</span><span>Intimidade</span><span>Interesse</span><span>Fatores de motivação</span><span>Próximo passo</span>
          </div>
          <div className="divide-y divide-white/60">
            {favorites.map((p, idx) => (
              <div key={p.id} className="grid grid-cols-1 gap-2 px-5 py-4 transition-colors hover:bg-white/40 md:grid-cols-[1.4fr_0.9fr_1fr_1.6fr_1.4fr] md:items-center md:gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-extrabold text-brand-500">{idx + 1}.</span>
                  <button onClick={() => openDetail(p)} className="truncate text-left font-display font-bold text-ink hover:text-brand-700">{p.name}</button>
                  <button onClick={() => toggleFavorite(p.id)} title="Remover dos principais" className="ml-auto md:hidden" style={{ background: "none", border: "none", cursor: "pointer" }}>⭐</button>
                </div>
                <div><IntimacyDots value={p.intimacy} /></div>
                <div><StarRating value={p.interest} size={18} onChange={(v) => updateProspect(p.id, { interest: v })} /></div>
                <div className="text-sm text-ink-soft">
                  {motivationsText(p) || <span className="text-ink-faint">—</span>}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-ink-soft">{p.nextStep || <span className="text-ink-faint">—</span>}</span>
                  <button onClick={() => openEdit(p)} className="btn btn-ghost !px-2.5 !py-1 !text-xs no-print">Editar</button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {favorites.length > 0 && favorites.length < 5 && (
        <p className="text-center text-sm text-ink-faint">Você marcou {favorites.length} de 5. <Link href="/prospectos" className="font-semibold text-brand-600 hover:underline">Marcar mais →</Link></p>
      )}
    </div>
  );
}
