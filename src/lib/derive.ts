import type { CategoryId, FunnelStatus, Prospect } from "./types";
import { CATEGORIES, STATUSES } from "./taxonomy";

export interface Stats {
  total: number;
  favorites: number;
  hot: number; // interest >= 4
  withNextStep: number;
  byCategory: { id: CategoryId; label: string; icon: string; count: number }[];
  byStatus: { id: FunnelStatus; label: string; color: string; count: number }[];
  byInterest: number[]; // index 0..5 => count
}

// Status que indicam que um contato foi feito (Contatado ou além no funil).
export const CONTACTED_STATUSES: FunnelStatus[] = [
  "contatado",
  "reuniao",
  "acompanhamento",
  "fechado",
];

/* ============================================================
   Fuso de São Paulo — toda a lógica de dia/semana do Desafio é
   ancorada em America/Sao_Paulo, independente do fuso do dispositivo.
   Trabalhamos com chaves "YYYY-MM-DD" (comparáveis por string).
   ============================================================ */
export const SP_TZ = "America/Sao_Paulo";

const spDayFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: SP_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "YYYY-MM-DD" do instante, no fuso de São Paulo. */
export function spDateKey(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return spDayFmt.format(d);
}

/** Segunda-feira da semana atual em SP, como "YYYY-MM-DD". */
export function spWeekStartKey(now: Date = new Date()): string {
  const today = spDateKey(now);
  const [y, m, d] = today.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = (dt.getUTCDay() + 6) % 7; // segunda = 0
  dt.setUTCDate(dt.getUTCDate() - dow);
  return dt.toISOString().slice(0, 10);
}

/** Data/hora atuais em SP (para exibição). */
export function spNowLabel(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: SP_TZ,
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());
}

export function computeStats(prospects: Prospect[]): Stats {
  const byCategory = CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    icon: c.icon,
    count: prospects.filter((p) => p.category === c.id).length,
  }));

  const byStatus = STATUSES.map((s) => ({
    id: s.id,
    label: s.label,
    color: s.color,
    count: prospects.filter((p) => p.status === s.id).length,
  }));

  const byInterest = [0, 1, 2, 3, 4, 5].map(
    (n) => prospects.filter((p) => p.interest === n).length,
  );

  return {
    total: prospects.length,
    favorites: prospects.filter((p) => p.favorite).length,
    hot: prospects.filter((p) => p.interest >= 4).length,
    withNextStep: prospects.filter((p) => p.nextStep && p.nextStep.trim()).length,
    byCategory,
    byStatus,
    byInterest,
  };
}

/**
 * Contatos feitos em um dia específico (chave "YYYY-MM-DD", fuso SP):
 * prospectos em status de contato (Contatado ou além) cuja última atualização
 * caiu naquele dia.
 */
export function contactsOnDay(prospects: Prospect[], dayKey: string): number {
  if (!dayKey) return 0;
  return prospects.filter(
    (p) =>
      CONTACTED_STATUSES.includes(p.status) &&
      spDateKey(p.updatedAt) === dayKey,
  ).length;
}

/** Total geral de contatos feitos (sem recorte de data). */
export function totalContacts(prospects: Prospect[]): number {
  return prospects.filter((p) => CONTACTED_STATUSES.includes(p.status)).length;
}

export function registeredThisWeek(prospects: Prospect[]): number {
  const weekStart = spWeekStartKey();
  return prospects.filter((p) => spDateKey(p.createdAt) >= weekStart).length;
}
