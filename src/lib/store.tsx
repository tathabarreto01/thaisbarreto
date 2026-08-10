"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AppData,
  ContactLogEntry,
  Prospect,
  ProspectDraft,
  WeeklyChallenge,
} from "./types";
import { getRepository } from "./repository";

interface StoreValue {
  ready: boolean;
  prospects: Prospect[];
  challenge: WeeklyChallenge | null;
  createProspect: (draft: ProspectDraft) => Promise<Prospect>;
  updateProspect: (id: string, patch: Partial<Prospect>) => Promise<Prospect>;
  deleteProspect: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  addContact: (
    id: string,
    entry: Omit<ContactLogEntry, "id">,
  ) => Promise<Prospect>;
  saveChallenge: (challenge: WeeklyChallenge) => Promise<void>;
  seedDemo: () => Promise<void>;
  reset: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function ProspectsProvider({ children }: { children: React.ReactNode }) {
  const repo = useMemo(() => getRepository(), []);
  const [ready, setReady] = useState(false);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [challenge, setChallenge] = useState<WeeklyChallenge | null>(null);

  const hydrate = useCallback((data: AppData) => {
    setProspects(data.prospects);
    setChallenge(data.challenge);
  }, []);

  useEffect(() => {
    let alive = true;
    repo.load().then((data) => {
      if (!alive) return;
      hydrate(data);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [repo, hydrate]);

  const createProspect = useCallback(
    async (draft: ProspectDraft) => {
      const p = await repo.createProspect(draft);
      setProspects((prev) => [p, ...prev]);
      return p;
    },
    [repo],
  );

  const updateProspect = useCallback(
    async (id: string, patch: Partial<Prospect>) => {
      const p = await repo.updateProspect(id, patch);
      setProspects((prev) => prev.map((x) => (x.id === id ? p : x)));
      return p;
    },
    [repo],
  );

  const deleteProspect = useCallback(
    async (id: string) => {
      await repo.deleteProspect(id);
      setProspects((prev) => prev.filter((x) => x.id !== id));
    },
    [repo],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      setProspects((prev) => {
        const target = prev.find((x) => x.id === id);
        if (target) {
          repo.updateProspect(id, { favorite: !target.favorite });
          return prev.map((x) =>
            x.id === id ? { ...x, favorite: !x.favorite } : x,
          );
        }
        return prev;
      });
    },
    [repo],
  );

  const addContact = useCallback(
    async (id: string, entry: Omit<ContactLogEntry, "id">) => {
      const p = await repo.addContact(id, entry);
      setProspects((prev) => prev.map((x) => (x.id === id ? p : x)));
      return p;
    },
    [repo],
  );

  const saveChallenge = useCallback(
    async (c: WeeklyChallenge) => {
      const saved = await repo.saveChallenge(c);
      setChallenge(saved);
    },
    [repo],
  );

  const seedDemo = useCallback(async () => {
    const { SAMPLE_PROSPECTS } = await import("./seed");
    const created = await repo.bulkCreate(SAMPLE_PROSPECTS);
    setProspects((prev) => [...created, ...prev]);
  }, [repo]);

  const reset = useCallback(async () => {
    const data = await repo.reset();
    hydrate(data);
  }, [repo, hydrate]);

  const value: StoreValue = {
    ready,
    prospects,
    challenge,
    createProspect,
    updateProspect,
    deleteProspect,
    toggleFavorite,
    addContact,
    saveChallenge,
    seedDemo,
    reset,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useProspects(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useProspects deve ser usado dentro de <ProspectsProvider>");
  }
  return ctx;
}
