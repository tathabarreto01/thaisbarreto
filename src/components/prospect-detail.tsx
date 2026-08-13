"use client";

import { useMemo, useState } from "react";
import type { Prospect } from "@/lib/types";
import {
  getCategoryDef,
  getIntimacyDef,
  CHANNELS,
  INTEREST_LABELS,
  MOTIVATION_OTHER,
} from "@/lib/taxonomy";
import { useProspects } from "@/lib/store";
import {
  Drawer,
  ConfirmDialog,
  IntimacyDots,
  StarRating,
  StatusBadge,
} from "./ui";

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

function digitsOf(phone: string): string {
  return phone.replace(/\D/g, "");
}

/* ---------------- Reusable labelled section ---------------- */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
        {title}
      </h4>
      {children}
    </section>
  );
}

export function ProspectDetail({
  open,
  prospect,
  onClose,
  onEdit,
}: {
  open: boolean;
  prospect: Prospect | null;
  onClose: () => void;
  onEdit: (p: Prospect) => void;
}) {
  const { toggleFavorite, deleteProspect } = useProspects();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const history = useMemo(
    () =>
      [...(prospect?.history ?? [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [prospect],
  );

  if (!prospect) return null;

  const cat = getCategoryDef(prospect.category);
  const intim = getIntimacyDef(prospect.intimacy);
  const phoneDigits = prospect.phone ? digitsOf(prospect.phone) : "";
  const hasContact = Boolean(
    prospect.phone || prospect.email || prospect.city,
  );
  const interestLabel =
    prospect.interest > 0 ? INTEREST_LABELS[prospect.interest - 1] : "Sem interesse";

  async function handleDelete() {
    setConfirmDelete(false);
    await deleteProspect(prospect!.id);
    onClose();
  }

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title="Detalhes do prospecto"
        footer={
          <div className="flex items-center gap-2">
            {prospect.phone && (
              <a
                href={`https://wa.me/55${phoneDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost !text-sm"
              >
                💬 WhatsApp
              </a>
            )}
            <button
              className="btn btn-primary ml-auto !text-sm"
              onClick={() => onEdit(prospect)}
            >
              Editar
            </button>
            <button
              className="btn btn-danger !text-sm"
              onClick={() => setConfirmDelete(true)}
            >
              Excluir
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          {/* Header */}
          <header className="flex items-start gap-3">
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl font-display text-lg font-bold text-white"
              style={{ background: "linear-gradient(135deg,#2563eb,#60a5fa)" }}
            >
              {initialsOf(prospect.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-xl font-extrabold leading-tight text-ink">
                {prospect.name}
              </h3>
              <p className="mt-1 text-sm text-ink-soft">
                <span className="mr-1">{cat.icon}</span>
                {cat.label} · {prospect.subcategory}
              </p>
            </div>
            <button
              onClick={() => toggleFavorite(prospect.id)}
              className="shrink-0 transition-transform hover:scale-125"
              aria-label={
                prospect.favorite
                  ? "Remover dos 5 principais"
                  : "Marcar como um dos 5 principais"
              }
              title={
                prospect.favorite
                  ? "Remover dos 5 principais"
                  : "Marcar como um dos 5 principais"
              }
              style={{
                background: "none",
                border: "none",
                lineHeight: 0,
                cursor: "pointer",
              }}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill={prospect.favorite ? "#f59e0b" : "none"}
                stroke={prospect.favorite ? "#f59e0b" : "#9db3d8"}
                strokeWidth="1.7"
              >
                <path
                  strokeLinejoin="round"
                  d="M12 3.5l2.6 5.27 5.82.85-4.21 4.1.99 5.8L12 16.8l-5.2 2.72.99-5.8-4.21-4.1 5.82-.85L12 3.5z"
                />
              </svg>
            </button>
          </header>

          {/* Status row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,.45)" }}>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Intimidade</span>
              <span className="flex items-center gap-2">
                <IntimacyDots value={prospect.intimacy} />
                <span className="text-sm font-semibold text-ink-soft">{intim.label}</span>
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Interesse</span>
              <span className="flex items-center gap-2">
                <StarRating value={prospect.interest} readOnly size={16} />
                <span className="text-sm font-semibold text-ink-soft">{interestLabel}</span>
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Status</span>
              <StatusBadge status={prospect.status} />
            </div>
          </div>

          {/* Personal data */}
          {(prospect.profession || prospect.maritalStatus) && (
            <Section title="Dados pessoais">
              <div className="flex flex-col gap-2">
                {prospect.profession && (
                  <div className="flex items-center gap-2 text-sm">
                    <span aria-hidden="true">💼</span>
                    <span className="font-semibold text-ink-soft">{prospect.profession}</span>
                  </div>
                )}
                {prospect.maritalStatus && (
                  <div className="flex items-center gap-2 text-sm">
                    <span aria-hidden="true">💍</span>
                    <span className="font-semibold text-ink-soft">{prospect.maritalStatus}</span>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Contact */}
          <Section title="Contato">
            {hasContact ? (
              <div className="flex flex-col gap-2">
                {prospect.phone && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span aria-hidden="true">📞</span>
                    <a href={`tel:${phoneDigits}`} className="font-semibold text-ink hover:text-brand-700">
                      {prospect.phone}
                    </a>
                    <a
                      href={`https://wa.me/55${phoneDigits}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="chip !py-0.5 hover:scale-105"
                      style={{ background: "rgba(220,252,231,.7)", color: "#15803d", borderColor: "rgba(21,128,61,.25)" }}
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                )}
                {prospect.email && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span aria-hidden="true">✉️</span>
                    <a href={`mailto:${prospect.email}`} className="truncate font-semibold text-ink hover:text-brand-700">
                      {prospect.email}
                    </a>
                  </div>
                )}
                {prospect.city && (
                  <div className="flex items-center gap-2 text-sm">
                    <span aria-hidden="true">📍</span>
                    <span className="font-semibold text-ink-soft">{prospect.city}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-ink-faint">Sem dados de contato.</p>
            )}
          </Section>

          {/* Motivations */}
          {prospect.motivations?.length > 0 && (
            <Section title="Fatores de motivação">
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
              </div>
              {prospect.motivations.includes(MOTIVATION_OTHER) &&
                prospect.interestNotes && (
                  <p className="text-sm text-ink-soft">
                    💡 {prospect.interestNotes}
                  </p>
                )}
            </Section>
          )}

          {/* Next step */}
          {prospect.nextStep && (
            <Section title="Próximo passo">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-700">
                <span aria-hidden="true">→</span>
                <span>{prospect.nextStep}</span>
                {prospect.nextStepDate && (
                  <span className="ml-auto shrink-0 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs text-brand-700">
                    {new Date(prospect.nextStepDate).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
            </Section>
          )}

          {/* Observations */}
          {prospect.observations && (
            <Section title="Observações">
              <p className="whitespace-pre-wrap rounded-xl bg-white/55 px-3 py-2 text-sm text-ink-soft">
                {prospect.observations}
              </p>
            </Section>
          )}

          {/* Contact history */}
          <Section title="Histórico de contatos">
            {history.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {history.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-start gap-2 rounded-xl bg-white/55 px-3 py-2 text-sm"
                  >
                    <span aria-hidden="true">
                      {CHANNELS[h.channel]?.icon ?? "•"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-ink">{h.note}</p>
                      <p className="text-[11px] text-ink-faint">
                        {CHANNELS[h.channel]?.label ?? h.channel} ·{" "}
                        {new Date(h.date).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-faint">
                Nenhum contato registrado.
              </p>
            )}
          </Section>

          {/* Timestamps */}
          <p className="text-[11px] text-ink-faint">
            Criado em {new Date(prospect.createdAt).toLocaleDateString("pt-BR")}
            {" · "}
            Atualizado em{" "}
            {new Date(prospect.updatedAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmDelete}
        danger
        title="Excluir prospecto?"
        message={`"${prospect.name}" será removido definitivamente. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
