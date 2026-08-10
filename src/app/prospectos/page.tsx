"use client";

import { useMemo, useState } from "react";
import { useProspects } from "@/lib/store";
import { CATEGORIES, INTIMACY, STATUSES } from "@/lib/taxonomy";
import type { CategoryId, FunnelStatus, Intimacy, Prospect } from "@/lib/types";
import { GlassCard, EmptyState, ConfirmDialog } from "@/components/ui";
import { ProspectCard } from "@/components/prospect-card";
import { useProspectForm } from "@/components/shell";
import { downloadCSV } from "@/lib/export";
import { LoadingScreen } from "../page";

type Sort = "recent" | "name" | "interest";

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
  const [toDelete, setToDelete] = useState<Prospect | null>(null);

  const filtered = useMemo(() => {
    let list = prospects.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (intim !== "all" && p.intimacy !== intim) return false;
      if (status !== "all" && p.status !== status) return false;
      if (p.interest < minInterest) return false;
      if (favOnly && !p.favorite) return false;
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
  }, [prospects, cat, intim, status, minInterest, favOnly, q, sort]);

  const activeFilters = (cat !== "all" ? 1 : 0) + (intim !== "all" ? 1 : 0) + (status !== "all" ? 1 : 0) + (minInterest > 0 ? 1 : 0) + (favOnly ? 1 : 0);

  function clearFilters() {
    setCat("all"); setIntim("all"); setStatus("all"); setMinInterest(0); setFavOnly(false); setQ("");
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
      <GlassCard className="reveal flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" strokeLinecap="round" /></svg>
            </span>
            <input className="field !pl-9" placeholder="Buscar por nome, cidade, interesse…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="field !w-auto" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="recent">Mais recentes</option>
            <option value="name">Nome (A-Z)</option>
            <option value="interest">Maior interesse</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select className="field !w-auto !py-1.5 !text-sm" value={cat} onChange={(e) => setCat(e.target.value as CategoryId | "all")}>
            <option value="all">Todas as categorias</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
          <select className="field !w-auto !py-1.5 !text-sm" value={intim} onChange={(e) => setIntim(e.target.value as Intimacy | "all")}>
            <option value="all">Toda intimidade</option>
            {INTIMACY.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
          </select>
          <select className="field !w-auto !py-1.5 !text-sm" value={status} onChange={(e) => setStatus(e.target.value as FunnelStatus | "all")}>
            <option value="all">Todo status</option>
            {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select className="field !w-auto !py-1.5 !text-sm" value={minInterest} onChange={(e) => setMinInterest(Number(e.target.value))}>
            <option value={0}>Qualquer interesse</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}★ ou mais</option>)}
          </select>
          <button onClick={() => setFavOnly((v) => !v)} className="chip transition-all" style={{ background: favOnly ? "rgba(245,158,11,.16)" : "rgba(255,255,255,.55)", color: favOnly ? "#b45309" : "var(--ink-soft)", borderColor: favOnly ? "rgba(245,158,11,.4)" : "rgba(37,99,235,.15)", fontWeight: 700, cursor: "pointer", padding: "0.4rem 0.75rem" }}>★ Só principais</button>
          {activeFilters > 0 && <button className="btn btn-ghost !py-1.5 !text-xs" onClick={clearFilters}>Limpar filtros ({activeFilters})</button>}
        </div>
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
