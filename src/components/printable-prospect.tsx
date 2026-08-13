"use client";

import { QRCodeSVG } from "qrcode.react";
import type { Prospect } from "@/lib/types";
import {
  getCategoryDef,
  getIntimacyDef,
  getStatusDef,
  INTEREST_LABELS,
  CHANNELS,
  MOTIVATION_OTHER,
} from "@/lib/taxonomy";

/**
 * Builds a `wa.me` link from a free-form phone string.
 * Keeps a leading Brazil code when it's already there (12-13 digits starting
 * with "55"), otherwise prefixes "55". Returns null when there are no digits.
 */
function whatsappLink(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const withCountry =
    digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
      ? digits
      : `55${digits}`;
  return `https://wa.me/${withCountry}`;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/* One labelled block inside the printed sheet. */
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border border-slate-300 px-3 py-2">
      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="text-[13px] text-black">{value || "—"}</span>
    </div>
  );
}

/**
 * A4-friendly document sheet with every field of a single prospect.
 * Meant to live inside the page's `.print-only` container: hidden on
 * screen, one sheet per page on print. Legible in pure black on white.
 */
export function PrintableProspect({ prospect }: { prospect: Prospect }) {
  const cat = getCategoryDef(prospect.category);
  const intim = getIntimacyDef(prospect.intimacy);
  const statusDef = getStatusDef(prospect.status);
  const stars = "★".repeat(prospect.interest) + "☆".repeat(5 - prospect.interest);
  const interestLabel =
    prospect.interest > 0 ? INTEREST_LABELS[prospect.interest - 1] : "Sem interesse";
  const history = [...(prospect.history ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const hasContact = Boolean(prospect.phone || prospect.email || prospect.city);
  const showOther =
    prospect.motivations?.includes(MOTIVATION_OTHER) && Boolean(prospect.interestNotes);
  const waHref = prospect.phone ? whatsappLink(prospect.phone) : null;

  return (
    <article className="print-page break-inside-avoid p-8 text-black">
      {/* Branded document header */}
      <header className="flex items-center justify-between gap-4 border-b-2 border-black pb-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center border-2 border-black text-black">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 3l6 2 5-2v14l-5 2-6-2-5 2V5l5-2z" />
              <path d="M9 3v16M15 5v16" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold text-black">
              Mapa de <span className="font-extrabold">Prospectos</span>
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Ficha do prospecto
            </span>
          </span>
        </div>
        <div className="text-right text-[11px] text-slate-600">
          <p>Emitido em</p>
          <p className="font-semibold text-black">{formatDate(new Date().toISOString())}</p>
        </div>
      </header>

      {/* Prospect identity + WhatsApp QR */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Ficha individual
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight text-black">
            {prospect.name}
          </h1>
          <p className="mt-1 text-sm text-slate-700">
            {cat.icon} {cat.label} · {prospect.subcategory}
          </p>
        </div>
        {waHref && (
          <figure className="flex shrink-0 flex-col items-center gap-1">
            <div className="border border-black p-1.5">
              <QRCodeSVG
                value={waHref}
                size={110}
                level="M"
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>
            <figcaption className="max-w-[128px] text-center text-[8px] font-semibold leading-tight text-slate-600">
              Aponte a câmera para chamar no WhatsApp
            </figcaption>
          </figure>
        )}
      </div>

      {/* Key attributes */}
      <div className="mt-4 grid grid-cols-3 gap-0 border border-slate-300">
        <Field label="Intimidade" value={intim.label} />
        <Field
          label="Interesse"
          value={
            <span>
              <span className="tracking-widest">{stars}</span>{" "}
              <span className="text-slate-600">({interestLabel})</span>
            </span>
          }
        />
        <Field label="Status" value={statusDef.label} />
      </div>

      {/* Personal data */}
      {(prospect.profession || prospect.maritalStatus) && (
        <section className="mt-5">
          <h2 className="mb-2 border-b border-slate-300 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Dados pessoais
          </h2>
          <div className="grid grid-cols-2 gap-0 border border-slate-300">
            <Field label="Profissão" value={prospect.profession} />
            <Field label="Estado civil" value={prospect.maritalStatus} />
          </div>
        </section>
      )}

      {/* Contact */}
      <section className="mt-5">
        <h2 className="mb-2 border-b border-slate-300 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Contato
        </h2>
        {hasContact ? (
          <div className="grid grid-cols-3 gap-0 border border-slate-300">
            <Field label="Telefone / WhatsApp" value={prospect.phone} />
            <Field label="E-mail" value={prospect.email} />
            <Field label="Cidade" value={prospect.city} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">Sem dados de contato.</p>
        )}
      </section>

      {/* Motivations */}
      <section className="mt-5">
        <h2 className="mb-2 border-b border-slate-300 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Fatores de motivação
        </h2>
        {prospect.motivations?.length > 0 ? (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-black">
            {prospect.motivations.map((m) => (
              <li key={m} className="before:mr-1 before:content-['•']">
                {m}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Nenhum fator registrado.</p>
        )}
        {showOther && (
          <p className="mt-1.5 text-[13px] text-slate-700">
            Outro: {prospect.interestNotes}
          </p>
        )}
      </section>

      {/* Next step */}
      <section className="mt-5">
        <h2 className="mb-2 border-b border-slate-300 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Próximo passo
        </h2>
        {prospect.nextStep ? (
          <p className="text-[13px] text-black">
            {prospect.nextStep}
            {prospect.nextStepDate && (
              <span className="text-slate-600"> — até {formatDate(prospect.nextStepDate)}</span>
            )}
          </p>
        ) : (
          <p className="text-sm text-slate-500">Nenhum próximo passo definido.</p>
        )}
      </section>

      {/* Observations */}
      {prospect.observations && (
        <section className="mt-5">
          <h2 className="mb-2 border-b border-slate-300 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Observações
          </h2>
          <p className="whitespace-pre-wrap text-[13px] text-black">{prospect.observations}</p>
        </section>
      )}

      {/* History */}
      <section className="mt-5">
        <h2 className="mb-2 border-b border-slate-300 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Histórico de contatos ({history.length})
        </h2>
        {history.length > 0 ? (
          <ul className="flex flex-col">
            {history.map((h) => (
              <li key={h.id} className="border-b border-slate-200 py-1.5 text-[13px]">
                <span className="text-slate-500">
                  {CHANNELS[h.channel]?.icon ?? "•"} {CHANNELS[h.channel]?.label ?? h.channel} ·{" "}
                  {formatDateTime(h.date)}
                </span>
                <p className="text-black">{h.note}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Nenhum contato registrado.</p>
        )}
      </section>

      {/* Footer / timestamps */}
      <footer className="mt-6 border-t border-slate-300 pt-2 text-[10px] text-slate-500">
        Criado em {formatDate(prospect.createdAt)} · Atualizado em{" "}
        {formatDate(prospect.updatedAt)}
      </footer>
    </article>
  );
}
