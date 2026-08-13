"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useProspects } from "@/lib/store";
import {
  CATEGORIES,
  getCategoryDef,
  getIntimacyDef,
  MOTIVATION_OTHER,
} from "@/lib/taxonomy";
import type { Prospect } from "@/lib/types";
import { GlassCard, EmptyState, IntimacyDots, StarRating, StatusBadge } from "@/components/ui";
import { PrintableProspect } from "@/components/printable-prospect";
import { useProspectForm } from "@/components/shell";
import { downloadCSV } from "@/lib/export";
import { LoadingScreen } from "../page";

type PrintJob = { kind: "fichas"; list: Prospect[] | null } | { kind: "resumo" };

function motivationsText(p: Prospect, sep = " · "): string {
  const parts = [...(p.motivations ?? [])];
  if (p.motivations?.includes(MOTIVATION_OTHER) && p.interestNotes) {
    parts.push(p.interestNotes);
  }
  return parts.join(sep);
}

function initialsOf(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}

/* Compact on-screen card: opens the detail on click, prints a single sheet. */
function PrintCard({
  prospect,
  onPrint,
}: {
  prospect: Prospect;
  onPrint: (p: Prospect) => void;
}) {
  const { openDetail } = useProspectForm();
  const cat = getCategoryDef(prospect.category);

  return (
    <GlassCard hover className="reveal group flex flex-col gap-3 p-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => openDetail(prospect)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDetail(prospect);
          }
        }}
        aria-label={`Ver detalhes de ${prospect.name}`}
        className="flex cursor-pointer flex-col gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
      >
        <div className="flex items-start gap-3">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#2563eb,#60a5fa)" }}
          >
            {initialsOf(prospect.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-[15px] font-bold text-ink">{prospect.name}</h3>
            <p className="mt-0.5 text-xs text-ink-faint">
              <span className="mr-1">{cat.icon}</span>
              {cat.label} · {prospect.subcategory}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <IntimacyDots value={prospect.intimacy} />
          <StarRating value={prospect.interest} readOnly size={16} />
          <StatusBadge status={prospect.status} />
        </div>
      </div>

      <div className="mt-1 flex items-center gap-2 border-t border-white/60 pt-3">
        <button
          className="btn btn-primary !py-1.5 !text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onPrint(prospect);
          }}
        >
          ⎙ Imprimir ficha
        </button>
        {(prospect.history?.length ?? 0) > 0 && (
          <span className="ml-auto text-[11px] text-ink-faint" title="Contatos registrados">
            📇 {prospect.history.length}
          </span>
        )}
      </div>
    </GlassCard>
  );
}

/* Summary map (category grid + top-5). Used for both the screen preview
   and the printed "mapa resumido" sheet. */
function SummarySheet({ prospects }: { prospects: Prospect[] }) {
  const byKey = useMemo(() => {
    const map = new Map<string, Prospect[]>();
    for (const p of prospects) {
      const key = `${p.category}::${p.subcategory}`;
      map.set(key, [...(map.get(key) ?? []), p]);
    }
    return map;
  }, [prospects]);

  const favorites = useMemo(() => prospects.filter((p) => p.favorite).slice(0, 5), [prospects]);

  return (
    <GlassCard strong className="print-page p-6 sm:p-8">
      <div className="mb-5 flex items-start justify-between border-b border-brand-200 pb-4">
        <div>
          <h3 className="font-display text-2xl font-extrabold text-ink">
            Mapa de <span className="text-gradient">Prospectos</span>
          </h3>
          <p className="font-hand text-lg text-brand-500">
            Sua próxima oportunidade pode estar mais perto do que você pensa.
          </p>
        </div>
        <div className="text-right text-xs text-ink-faint">
          <p>{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
          <p className="font-bold text-brand-700">{prospects.length} prospectos</p>
        </div>
      </div>

      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {CATEGORIES.map((cat) => (
          <div key={cat.id} className="break-inside-avoid">
            <h4 className="mb-1.5 font-display text-sm font-bold uppercase tracking-wide text-brand-700">
              {cat.icon} {cat.label}
            </h4>
            <div className="flex flex-col gap-1.5">
              {cat.subcategories.map((sub) => {
                const list = byKey.get(`${cat.id}::${sub}`) ?? [];
                return (
                  <div key={sub} className="flex gap-2 text-sm leading-tight">
                    <span className="shrink-0 font-semibold text-ink-soft">• {sub}:</span>
                    <span className="flex-1 border-b border-dotted border-brand-200 text-ink">
                      {list.map((p) => p.name).join(", ")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7 break-inside-avoid">
        <div
          className="mb-2 inline-block rounded-lg px-4 py-1.5 font-hand text-lg text-white"
          style={{ background: "linear-gradient(135deg,#1e40af,#2563eb)" }}
        >
          Meus 5 principais
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {favorites.map((p, i) => (
            <div
              key={p.id}
              className="flex break-inside-avoid flex-col gap-2 rounded-xl border border-brand-300 p-3.5"
            >
              <div className="flex items-baseline gap-2 border-b border-brand-200 pb-2">
                <span className="font-display text-base font-extrabold text-brand-700">{i + 1}.</span>
                <span className="font-display text-base font-bold text-ink">{p.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-ink-faint">Intimidade</span>
                  <span className="text-ink-soft">{getIntimacyDef(p.intimacy).label}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-ink-faint">Interesse</span>
                  <span className="text-amber-500">
                    {"★".repeat(p.interest) + "☆".repeat(5 - p.interest)}
                  </span>
                </div>
              </div>

              <div className="text-sm">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-ink-faint">Fatores de motivação</span>
                <span className="text-ink-soft">{motivationsText(p) || "—"}</span>
              </div>

              <div className="text-sm">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-ink-faint">Próximo passo</span>
                <span className="text-ink-soft">{p.nextStep || "—"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

export default function ImprimirPage() {
  const { ready, prospects } = useProspects();

  // Default: todas as fichas (mantém o Ctrl+P do navegador imprimindo tudo).
  const [job, setJob] = useState<PrintJob>({ kind: "fichas", list: null });
  const [printNonce, setPrintNonce] = useState(0);
  const pendingPrint = useRef(false);

  // Dispara a impressão só depois que o print-only já renderizou a seleção.
  useEffect(() => {
    if (!pendingPrint.current) return;
    pendingPrint.current = false;
    window.print();
    setJob({ kind: "fichas", list: null }); // volta ao padrão após imprimir
  }, [printNonce]);

  function requestPrint(next: PrintJob) {
    setJob(next);
    pendingPrint.current = true;
    setPrintNonce((n) => n + 1);
  }

  if (!ready) return <LoadingScreen />;

  const fichas = job.kind === "fichas" ? (job.list ?? prospects) : [];

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <header className="no-print reveal mb-4 flex flex-col justify-between gap-3 pt-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Imprimir / Exportar</h1>
          <p className="text-sm text-ink-soft">
            Imprima a ficha individual de cada prospecto ou exporte tudo em CSV.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost" onClick={() => downloadCSV(prospects)} disabled={!prospects.length}>
            ⬇ CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={() => requestPrint({ kind: "fichas", list: null })}
            disabled={!prospects.length}
          >
            ⎙ Imprimir todas as fichas
          </button>
        </div>
      </header>

      {prospects.length === 0 ? (
        <EmptyState
          title="Nenhum prospecto ainda"
          message="Adicione pessoas para gerar fichas de impressão ou exportar em CSV."
        />
      ) : (
        <div className="no-print flex flex-col gap-8">
          {/* Cards grid */}
          <section>
            <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-brand-700">
              Fichas individuais · {prospects.length}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {prospects.map((p) => (
                <PrintCard
                  key={p.id}
                  prospect={p}
                  onPrint={(one) => requestPrint({ kind: "fichas", list: [one] })}
                />
              ))}
            </div>
          </section>

          {/* Secondary: summary map preview + its own print action */}
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-brand-700">
                Mapa resumido
              </h2>
              <button
                className="btn btn-ghost !py-1.5 !text-xs"
                onClick={() => requestPrint({ kind: "resumo" })}
              >
                ⎙ Imprimir mapa (resumo)
              </button>
            </div>
            <SummarySheet prospects={prospects} />
          </section>
        </div>
      )}

      {/* Print-only: renders exactly what should come out of the printer. */}
      <div className="print-only" aria-hidden="true">
        {job.kind === "resumo" ? (
          <SummarySheet prospects={prospects} />
        ) : (
          fichas.map((p) => <PrintableProspect key={p.id} prospect={p} />)
        )}
      </div>
    </div>
  );
}
