"use client";

import { useMemo, useState } from "react";
import { useProspects } from "@/lib/store";
import { CATEGORIES, INTIMACY, STATUSES } from "@/lib/taxonomy";
import type { CategoryId, FunnelStatus, Intimacy, Prospect } from "@/lib/types";
import { GlassCard, EmptyState, ConfirmDialog, LoadingScreen } from "@/components/ui";
import { ProspectCard } from "@/components/prospect-card";
import { useProspectForm } from "@/components/shell";
import { downloadCSV } from "@/lib/export";
import { MENU_COMPACT, SelectMenu, type SelectOption } from "@/components/select-menu";

type Sort = "recent" | "name" | "interest";
type Period = "all" | "today" | "week" | "month" | "year" | "custom";

const PERIOD_LABELS: Record<Period, string> = {
  all: "Todos os períodos",
  today: "Hoje",
  week: "Esta semana",
  month: "Este mês",
  year: "Este ano",
  custom: "Personalizado",
};

/** Gatilho compacto da barra de filtros (não estica no flex-wrap). */
const COMPACT_TRIGGER = "!w-auto !py-1.5 !text-sm";

const SORT_OPTIONS: SelectOption[] = [
  { value: "recent", label: "Mais recentes" },
  { value: "name", label: "Nome (A-Z)" },
  { value: "interest", label: "Maior interesse" },
];

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: "all", label: "Todas as categorias" },
  ...CATEGORIES.map((c) => ({ value: c.id, label: c.label, icon: c.icon })),
];

const INTIMACY_OPTIONS: SelectOption[] = [
  { value: "all", label: "Toda intimidade" },
  ...INTIMACY.map((i) => ({ value: i.id, label: i.label })),
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: "all", label: "Todo status" },
  ...STATUSES.map((s) => ({ value: s.id, label: s.label })),
];

const INTEREST_OPTIONS: SelectOption[] = [
  { value: "0", label: "Qualquer interesse" },
  ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}★ ou mais` })),
];

const PERIOD_OPTIONS: SelectOption[] = (Object.keys(PERIOD_LABELS) as Period[]).map((p) => ({
  value: p,
  label: PERIOD_LABELS[p],
  icon: "🗓️",
}));

/** Início da semana com segunda-feira = 0 (igual a derive.ts). */
function startOfWeek(base: Date): Date {
  const d = new Date(base);
  const day = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

function startOfDay(iso: string): number {
  const d = new Date(`${iso}T00:00:00`);
  return d.getTime();
}

function endOfDay(iso: string): number {
  const d = new Date(`${iso}T23:59:59.999`);
  return d.getTime();
}

/** Intervalo [start, end] em ms para o período; null = sem restrição de data. */
function periodRange(period: Period, from: string, to: string): { start: number; end: number } | null {
  if (period === "all") return null;
  if (period === "custom") {
    if (!from && !to) return null;
    return {
      start: from ? startOfDay(from) : -Infinity,
      end: to ? endOfDay(to) : Infinity,
    };
  }
  const now = new Date();
  const end = now.getTime();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "today") return { start: start.getTime(), end };
  if (period === "week") return { start: startOfWeek(now).getTime(), end };
  if (period === "month") {
    start.setDate(1);
    return { start: start.getTime(), end };
  }
  start.setMonth(0, 1);
  return { start: start.getTime(), end };
}

export default function ProspectosPage() {
  const { ready, prospects, deleteProspect } = useProspects();
  const { openCreate } = useProspectForm();

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const [intim, setIntim] = useState<Intimacy | "all">("all");
  const [status, setStatus] = useState<FunnelStatus | "all">("all");
  const [minInterest, setMinInterest] = useState(0);
  const [favOnly, setFavOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("recent");
  const [period, setPeriod] = useState<Period>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [toDelete, setToDelete] = useState<Prospect | null>(null);

  const range = useMemo(() => periodRange(period, dateFrom, dateTo), [period, dateFrom, dateTo]);

  const filtered = useMemo(() => {
    let list = prospects.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (intim !== "all" && p.intimacy !== intim) return false;
      if (status !== "all" && p.status !== status) return false;
      if (p.interest < minInterest) return false;
      if (favOnly && !p.favorite) return false;
      if (range) {
        const created = new Date(p.createdAt).getTime();
        if (created < range.start || created > range.end) return false;
      }
      if (q.trim()) {
        const hay = `${p.name} ${p.subcategory} ${p.city ?? ""} ${p.interestNotes ?? ""} ${p.nextStep ?? ""}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "pt-BR");
      if (sort === "interest") return b.interest - a.interest;
      return a.createdAt < b.createdAt ? 1 : -1;
    });
    return list;
  }, [prospects, cat, intim, status, minInterest, favOnly, q, sort, range]);

  const activeFilters = (cat !== "all" ? 1 : 0) + (intim !== "all" ? 1 : 0) + (status !== "all" ? 1 : 0) + (minInterest > 0 ? 1 : 0) + (favOnly ? 1 : 0) + (period !== "all" ? 1 : 0);

  function clearFilters() {
    setCat("all"); setIntim("all"); setStatus("all"); setMinInterest(0); setFavOnly(false); setQ("");
    setPeriod("all"); setDateFrom(""); setDateTo("");
  }

  if (!ready) return <LoadingScreen />;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 pb-6">
      <header className="reveal flex flex-col justify-between gap-3 pt-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Prospectos</h1>
          <p className="text-sm text-ink-soft">{filtered.length} de {prospects.length} {prospects.length === 1 ? "pessoa" : "pessoas"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost" onClick={() => downloadCSV(filtered)} disabled={!filtered.length}>⬇ Exportar CSV</button>
          <button className="btn btn-primary" onClick={() => openCreate()}>+ Novo</button>
        </div>
      </header>

      {/* Filters */}
      <GlassCard className="reveal relative z-30 flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" strokeLinecap="round" /></svg>
            </span>
            <input className="field !pl-9" placeholder="Buscar por nome, cidade, interesse…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <SelectMenu
            id="filter-sort"
            ariaLabel="Ordenar por"
            value={sort}
            options={SORT_OPTIONS}
            triggerClassName="!w-auto"
            menuClassName={MENU_COMPACT}
            onChange={(v) => setSort(v as Sort)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SelectMenu
            id="filter-category"
            ariaLabel="Categoria"
            value={cat}
            options={CATEGORY_OPTIONS}
            triggerClassName={COMPACT_TRIGGER}
            menuClassName={MENU_COMPACT}
            onChange={(v) => setCat(v as CategoryId | "all")}
          />
          <SelectMenu
            id="filter-intimacy"
            ariaLabel="Nível de intimidade"
            value={intim}
            options={INTIMACY_OPTIONS}
            triggerClassName={COMPACT_TRIGGER}
            menuClassName={MENU_COMPACT}
            onChange={(v) => setIntim(v as Intimacy | "all")}
          />
          <SelectMenu
            id="filter-status"
            ariaLabel="Status no funil"
            value={status}
            options={STATUS_OPTIONS}
            triggerClassName={COMPACT_TRIGGER}
            menuClassName={MENU_COMPACT}
            onChange={(v) => setStatus(v as FunnelStatus | "all")}
          />
          <SelectMenu
            id="filter-interest"
            ariaLabel="Interesse mínimo"
            value={String(minInterest)}
            options={INTEREST_OPTIONS}
            triggerClassName={COMPACT_TRIGGER}
            menuClassName={MENU_COMPACT}
            onChange={(v) => setMinInterest(Number(v))}
          />
          <SelectMenu
            id="filter-period"
            ariaLabel="Período de cadastro"
            value={period}
            options={PERIOD_OPTIONS}
            triggerClassName={COMPACT_TRIGGER}
            menuClassName={MENU_COMPACT}
            onChange={(v) => setPeriod(v as Period)}
          />
          <button onClick={() => setFavOnly((v) => !v)} className="chip transition-all" style={{ background: favOnly ? "rgba(245,158,11,.16)" : "var(--w55)", color: favOnly ? "var(--favorite-fg)" : "var(--ink-soft)", borderColor: favOnly ? "rgba(245,158,11,.4)" : "var(--chip-muted-border)", fontWeight: 700, cursor: "pointer", padding: "0.4rem 0.75rem" }}>★ Só principais</button>
          {activeFilters > 0 && <button className="btn btn-ghost !py-1.5 !text-xs" onClick={clearFilters}>Limpar filtros ({activeFilters})</button>}
        </div>

        {period === "custom" && (
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="label" htmlFor="filter-date-from">De</label>
              <input id="filter-date-from" type="date" className="field !w-auto !py-1.5 !text-sm" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="filter-date-to">Até</label>
              <input id="filter-date-to" type="date" className="field !w-auto !py-1.5 !text-sm" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
        )}

        {period !== "all" && (
          <div className="flex items-center gap-2">
            <span className="chip chip-brand chip-lg">
              🗓️ {filtered.length} {filtered.length === 1 ? "cadastrado" : "cadastrados"} no período
            </span>
          </div>
        )}
      </GlassCard>

      {/* List */}
      {prospects.length === 0 ? (
        <EmptyState title="Nenhum prospecto ainda" message="Adicione pessoas manualmente ou use o Mapa para percorrer cada grupo." action={<button className="btn btn-primary" onClick={() => openCreate()}>+ Adicionar prospecto</button>} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="Nada encontrado" message="Nenhum prospecto corresponde aos filtros atuais." action={<button className="btn btn-ghost" onClick={clearFilters}>Limpar filtros</button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => <ProspectCard key={p.id} prospect={p} onDelete={setToDelete} />)}
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        danger
        title="Excluir prospecto?"
        message={`"${toDelete?.name}" será removido permanentemente. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onCancel={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) deleteProspect(toDelete.id); setToDelete(null); }}
      />
    </div>
  );
}
