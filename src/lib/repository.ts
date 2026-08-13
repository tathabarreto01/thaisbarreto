import type {
  AppData,
  Prospect,
  ProspectDraft,
  WeeklyChallenge,
  ContactLogEntry,
} from "./types";
import { isSupabaseConfigured } from "./supabase";
import { SupabaseRepository } from "./supabase-repository";

/**
 * Swappable data layer.
 *
 * Every method is async and returns plain data, so this exact interface can
 * later be re-implemented on top of Neon Postgres + Clerk (via Server Actions
 * or Route Handlers) WITHOUT touching any UI code. Only `getRepository()`
 * changes — see `CloudRepository` note at the bottom.
 */
export interface ProspectRepository {
  load(): Promise<AppData>;
  createProspect(draft: ProspectDraft): Promise<Prospect>;
  bulkCreate(drafts: ProspectDraft[]): Promise<Prospect[]>;
  updateProspect(id: string, patch: Partial<Prospect>): Promise<Prospect>;
  deleteProspect(id: string): Promise<void>;
  addContact(id: string, entry: Omit<ContactLogEntry, "id">): Promise<Prospect>;
  saveChallenge(challenge: WeeklyChallenge): Promise<WeeklyChallenge>;
  reset(): Promise<AppData>;
}

const STORAGE_KEY = "mapa-de-prospectos:v1";

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowISO() {
  return new Date().toISOString();
}

function defaultData(): AppData {
  return {
    version: 1,
    prospects: [],
    challenge: {
      week: 1,
      goalCount: 15,
      contactGoal: 5,
      startedAt: nowISO(),
    },
  };
}

/** localStorage-backed implementation (client-only, single device). */
class LocalStorageRepository implements ProspectRepository {
  private read(): AppData {
    if (typeof window === "undefined") return defaultData();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      const parsed = JSON.parse(raw) as AppData;
      if (!parsed || parsed.version !== 1) return defaultData();
      // defensive defaults
      parsed.prospects = (parsed.prospects ?? []).map((p) => ({
        ...p,
        history: p.history ?? [],
        favorite: Boolean(p.favorite),
        motivations: p.motivations ?? [],
      }));
      return parsed;
    } catch {
      return defaultData();
    }
  }

  private write(data: AppData): AppData {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    return data;
  }

  async load(): Promise<AppData> {
    return this.read();
  }

  async createProspect(draft: ProspectDraft): Promise<Prospect> {
    const data = this.read();
    const prospect: Prospect = {
      id: newId(),
      name: draft.name.trim(),
      category: draft.category,
      subcategory: draft.subcategory,
      intimacy: draft.intimacy,
      interest: draft.interest ?? 0,
      status: draft.status ?? "novo",
      phone: draft.phone,
      email: draft.email,
      city: draft.city,
      profession: draft.profession,
      maritalStatus: draft.maritalStatus,
      motivations: draft.motivations ?? [],
      interestNotes: draft.interestNotes,
      nextStep: draft.nextStep,
      nextStepDate: draft.nextStepDate,
      observations: draft.observations,
      favorite: draft.favorite ?? false,
      history: draft.history ?? [],
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    data.prospects.unshift(prospect);
    this.write(data);
    return prospect;
  }

  async bulkCreate(drafts: ProspectDraft[]): Promise<Prospect[]> {
    const data = this.read();
    const created: Prospect[] = drafts.map((draft) => ({
      id: newId(),
      name: draft.name.trim(),
      category: draft.category,
      subcategory: draft.subcategory,
      intimacy: draft.intimacy,
      interest: draft.interest ?? 0,
      status: draft.status ?? "novo",
      phone: draft.phone,
      email: draft.email,
      city: draft.city,
      profession: draft.profession,
      maritalStatus: draft.maritalStatus,
      motivations: draft.motivations ?? [],
      interestNotes: draft.interestNotes,
      nextStep: draft.nextStep,
      nextStepDate: draft.nextStepDate,
      observations: draft.observations,
      favorite: draft.favorite ?? false,
      history: draft.history ?? [],
      createdAt: nowISO(),
      updatedAt: nowISO(),
    }));
    data.prospects = [...created, ...data.prospects];
    this.write(data);
    return created;
  }

  async updateProspect(id: string, patch: Partial<Prospect>): Promise<Prospect> {
    const data = this.read();
    const idx = data.prospects.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Prospecto não encontrado");
    const updated: Prospect = {
      ...data.prospects[idx],
      ...patch,
      id,
      updatedAt: nowISO(),
    };
    data.prospects[idx] = updated;
    this.write(data);
    return updated;
  }

  async deleteProspect(id: string): Promise<void> {
    const data = this.read();
    data.prospects = data.prospects.filter((p) => p.id !== id);
    this.write(data);
  }

  async addContact(
    id: string,
    entry: Omit<ContactLogEntry, "id">,
  ): Promise<Prospect> {
    const data = this.read();
    const idx = data.prospects.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Prospecto não encontrado");
    const full: ContactLogEntry = { ...entry, id: newId() };
    data.prospects[idx].history = [full, ...(data.prospects[idx].history ?? [])];
    data.prospects[idx].updatedAt = nowISO();
    this.write(data);
    return data.prospects[idx];
  }

  async saveChallenge(challenge: WeeklyChallenge): Promise<WeeklyChallenge> {
    const data = this.read();
    data.challenge = challenge;
    this.write(data);
    return challenge;
  }

  async reset(): Promise<AppData> {
    return this.write(defaultData());
  }
}

let instance: ProspectRepository | null = null;

/**
 * Single place that decides which backend powers the app.
 *
 * - Supabase configured (NEXT_PUBLIC_SUPABASE_* set) → cloud + login, data
 *   scoped per user via RLS.
 * - Otherwise → localStorage (single device, no login).
 *
 * Everything above (UI, store, components) is backend-agnostic — only this
 * function decides which implementation is used.
 */
export function getRepository(): ProspectRepository {
  if (!instance) {
    if (isSupabaseConfigured()) {
      instance = new SupabaseRepository();
    } else {
      instance = new LocalStorageRepository();
    }
  }
  return instance;
}
