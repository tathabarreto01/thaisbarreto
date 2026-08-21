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
  contactsThisWeek: number;
}

// Status que indicam que um contato foi feito (Contatado ou além no funil).
const CONTACTED_STATUSES: FunnelStatus[] = [
  "contatado",
  "reuniao",
  "acompanhamento",
  "fechado",
];

function startOfWeek(d = new Date()): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

export function computeStats(prospects: Prospect[]): Stats {
  const weekStart = startOfWeek().getTime();

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

  // "Fazer contatos": conta prospectos que estão em status de contato (Contatado
  // ou além no funil) e que foram CADASTRADOS nesta semana — ancorado na data de
  // cadastro (createdAt), igual ao "Registrar prospectos". Atualiza sozinho quando
  // a usuária move um prospecto (desta semana) para Contatado+.
  const contactsThisWeek = prospects.filter(
    (p) =>
      CONTACTED_STATUSES.includes(p.status) &&
      new Date(p.createdAt).getTime() >= weekStart,
  ).length;

  return {
    total: prospects.length,
    favorites: prospects.filter((p) => p.favorite).length,
    hot: prospects.filter((p) => p.interest >= 4).length,
    withNextStep: prospects.filter((p) => p.nextStep && p.nextStep.trim()).length,
    byCategory,
    byStatus,
    byInterest,
    contactsThisWeek,
  };
}

export function registeredThisWeek(prospects: Prospect[]): number {
  const weekStart = startOfWeek().getTime();
  return prospects.filter((p) => new Date(p.createdAt).getTime() >= weekStart)
    .length;
}
