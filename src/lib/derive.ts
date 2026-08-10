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

  const contactsThisWeek = prospects.reduce(
    (acc, p) =>
      acc +
      (p.history ?? []).filter(
        (h) => new Date(h.date).getTime() >= weekStart,
      ).length,
    0,
  );

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
