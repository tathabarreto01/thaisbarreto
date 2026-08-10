import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AppData,
  ContactLogEntry,
  Prospect,
  ProspectDraft,
  WeeklyChallenge,
} from "./types";
import type { ProspectRepository } from "./repository";
import { newId } from "./repository";
import { getSupabase } from "./supabase";

// DB row shape (snake_case) for the `prospects` table.
interface Row {
  id: string;
  name: string;
  category: Prospect["category"];
  subcategory: string;
  intimacy: Prospect["intimacy"];
  interest: number;
  status: Prospect["status"];
  phone: string | null;
  email: string | null;
  city: string | null;
  interest_notes: string | null;
  next_step: string | null;
  next_step_date: string | null;
  favorite: boolean;
  history: ContactLogEntry[] | null;
  created_at: string;
  updated_at: string;
}

function rowToProspect(r: Row): Prospect {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    subcategory: r.subcategory,
    intimacy: r.intimacy,
    interest: r.interest,
    status: r.status,
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
    city: r.city ?? undefined,
    interestNotes: r.interest_notes ?? undefined,
    nextStep: r.next_step ?? undefined,
    nextStepDate: r.next_step_date ?? undefined,
    favorite: r.favorite,
    history: r.history ?? [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function draftToRow(draft: ProspectDraft): Record<string, unknown> {
  return {
    name: draft.name.trim(),
    category: draft.category,
    subcategory: draft.subcategory,
    intimacy: draft.intimacy,
    interest: draft.interest ?? 0,
    status: draft.status ?? "novo",
    phone: draft.phone ?? null,
    email: draft.email ?? null,
    city: draft.city ?? null,
    interest_notes: draft.interestNotes ?? null,
    next_step: draft.nextStep ?? null,
    next_step_date: draft.nextStepDate ?? null,
    favorite: draft.favorite ?? false,
    history: draft.history ?? [],
  };
}

// Only maps the fields the UI actually patches.
function patchToRow(patch: Partial<Prospect>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const map: Record<string, string> = {
    name: "name",
    category: "category",
    subcategory: "subcategory",
    intimacy: "intimacy",
    interest: "interest",
    status: "status",
    phone: "phone",
    email: "email",
    city: "city",
    interestNotes: "interest_notes",
    nextStep: "next_step",
    nextStepDate: "next_step_date",
    favorite: "favorite",
    history: "history",
  };
  for (const [k, col] of Object.entries(map)) {
    if (k in patch) row[col] = (patch as Record<string, unknown>)[k] ?? null;
  }
  row.updated_at = new Date().toISOString();
  return row;
}

const DEFAULT_CHALLENGE: WeeklyChallenge = {
  week: 1,
  goalCount: 15,
  contactGoal: 5,
  startedAt: new Date().toISOString(),
};

/** Cloud-backed repository. Data is scoped to the logged-in user via RLS. */
export class SupabaseRepository implements ProspectRepository {
  private get db(): SupabaseClient {
    return getSupabase();
  }

  async load(): Promise<AppData> {
    const [{ data: rows, error }, { data: state }] = await Promise.all([
      this.db.from("prospects").select("*").order("created_at", { ascending: false }),
      this.db.from("app_state").select("challenge").maybeSingle(),
    ]);
    if (error) throw error;
    return {
      version: 1,
      prospects: (rows as Row[] | null ?? []).map(rowToProspect),
      challenge: (state?.challenge as WeeklyChallenge) ?? DEFAULT_CHALLENGE,
    };
  }

  async createProspect(draft: ProspectDraft): Promise<Prospect> {
    const { data, error } = await this.db
      .from("prospects")
      .insert(draftToRow(draft))
      .select("*")
      .single();
    if (error) throw error;
    return rowToProspect(data as Row);
  }

  async bulkCreate(drafts: ProspectDraft[]): Promise<Prospect[]> {
    if (drafts.length === 0) return [];
    const { data, error } = await this.db
      .from("prospects")
      .insert(drafts.map(draftToRow))
      .select("*");
    if (error) throw error;
    return (data as Row[]).map(rowToProspect);
  }

  async updateProspect(id: string, patch: Partial<Prospect>): Promise<Prospect> {
    const { data, error } = await this.db
      .from("prospects")
      .update(patchToRow(patch))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return rowToProspect(data as Row);
  }

  async deleteProspect(id: string): Promise<void> {
    const { error } = await this.db.from("prospects").delete().eq("id", id);
    if (error) throw error;
  }

  async addContact(
    id: string,
    entry: Omit<ContactLogEntry, "id">,
  ): Promise<Prospect> {
    const { data: current, error: readErr } = await this.db
      .from("prospects")
      .select("history")
      .eq("id", id)
      .single();
    if (readErr) throw readErr;
    const full: ContactLogEntry = { ...entry, id: newId() };
    const history = [full, ...((current?.history as ContactLogEntry[]) ?? [])];
    const { data, error } = await this.db
      .from("prospects")
      .update({ history, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return rowToProspect(data as Row);
  }

  async saveChallenge(challenge: WeeklyChallenge): Promise<WeeklyChallenge> {
    const { data: userData } = await this.db.auth.getUser();
    const userId = userData.user?.id;
    const { error } = await this.db
      .from("app_state")
      .upsert({ user_id: userId, challenge }, { onConflict: "user_id" });
    if (error) throw error;
    return challenge;
  }

  async reset(): Promise<AppData> {
    const { error } = await this.db
      .from("prospects")
      .delete()
      .not("id", "is", null);
    if (error) throw error;
    return { version: 1, prospects: [], challenge: DEFAULT_CHALLENGE };
  }
}
