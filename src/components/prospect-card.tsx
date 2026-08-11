"use client";

import type { Prospect } from "@/lib/types";
import { getCategoryDef, MOTIVATION_OTHER } from "@/lib/taxonomy";
import { useProspects } from "@/lib/store";
import { GlassCard, IntimacyDots, StarRating, StatusBadge } from "./ui";
import { useProspectForm } from "./shell";

export function ProspectCard({
  prospect,
  onDelete,
}: {
  prospect: Prospect;
  onDelete: (p: Prospect) => void;
}) {
  const { toggleFavorite } = useProspects();
  const { openEdit, openDetail } = useProspectForm();
  const cat = getCategoryDef(prospect.category);

  const initials = prospect.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

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
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#2563eb,#60a5fa)" }}>
          {initials || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-[15px] font-bold text-ink">{prospect.name}</h3>
          </div>
          <p className="mt-0.5 text-xs text-ink-faint">
            <span className="mr-1">{cat.icon}</span>{cat.label} · {prospect.subcategory}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(prospect.id); }}
          className="shrink-0 transition-transform hover:scale-125"
          aria-label="Marcar como principal"
          title={prospect.favorite ? "Remover dos 5 principais" : "Marcar como um dos 5 principais"}
          style={{ background: "none", border: "none", lineHeight: 0, cursor: "pointer" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={prospect.favorite ? "#f59e0b" : "none"} stroke={prospect.favorite ? "#f59e0b" : "#9db3d8"} strokeWidth="1.7">
            <path strokeLinejoin="round" d="M12 3.5l2.6 5.27 5.82.85-4.21 4.1.99 5.8L12 16.8l-5.2 2.72.99-5.8-4.21-4.1 5.82-.85L12 3.5z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <IntimacyDots value={prospect.intimacy} />
        <StarRating value={prospect.interest} readOnly size={16} />
        <StatusBadge status={prospect.status} />
      </div>

      {prospect.motivations?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {prospect.motivations.map((m) => (
            <span
              key={m}
              className="chip"
              style={{
                background: "rgba(219,234,254,.7)",
                color: "var(--brand-700, #1d4ed8)",
                borderColor: "rgba(37,99,235,.2)",
              }}
            >
              {m}
            </span>
          ))}
          {prospect.motivations.includes(MOTIVATION_OTHER) && prospect.interestNotes && (
            <span className="w-full text-xs text-ink-soft">💡 {prospect.interestNotes}</span>
          )}
        </div>
      )}

      {prospect.nextStep && (
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-700">
          <span>→</span>
          <span className="truncate">{prospect.nextStep}</span>
          {prospect.nextStepDate && (
            <span className="ml-auto shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] text-brand-700">
              {new Date(prospect.nextStepDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </span>
          )}
        </div>
      )}
      </div>

      <div className="mt-1 flex items-center gap-2 border-t border-white/60 pt-3">
        {prospect.phone && (
          <a href={`https://wa.me/55${prospect.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !py-1.5 !text-xs" onClick={(e) => e.stopPropagation()}>
            💬 WhatsApp
          </a>
        )}
        <button className="btn btn-ghost !py-1.5 !text-xs" onClick={(e) => { e.stopPropagation(); openEdit(prospect); }}>Editar</button>
        <button className="btn btn-ghost !py-1.5 !text-xs !text-ink-faint" onClick={(e) => { e.stopPropagation(); onDelete(prospect); }} title="Excluir" aria-label="Excluir prospecto" style={{ marginLeft: "auto" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>
        </button>
        {(prospect.history?.length ?? 0) > 0 && (
          <span className="text-[11px] text-ink-faint" title="Contatos registrados">📇 {prospect.history.length}</span>
        )}
      </div>
    </GlassCard>
  );
}
