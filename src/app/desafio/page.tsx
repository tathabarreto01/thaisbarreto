"use client";

import { useMemo, useState } from "react";
import { useProspects } from "@/lib/store";
import { computeStats, registeredThisWeek, spDateKey, spNowLabel, SP_TZ } from "@/lib/derive";
import { getCategoryDef } from "@/lib/taxonomy";
import type { Prospect } from "@/lib/types";
import { GlassCard, ProgressRing } from "@/components/ui";
import { useProspectForm } from "@/components/shell";
import { LoadingScreen } from "../page";

/** Chave `YYYY-MM-DD` do dia do cadastro, no fuso de São Paulo. */
function localDayKey(iso: string): string {
  return spDateKey(iso);
}

/** Rótulo por extenso: "12 de agosto de 2026". */
function formatDayLong(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

/** Rótulo curto: "12/08/2026". */
function formatDayShort(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR");
}

function registrationTime(p: Prospect): number {
  return new Date(p.createdAt).getTime();
}

function RegistrationItem({ prospect, onOpen }: { prospect: Prospect; onOpen: (p: Prospect) => void }) {
  const cat = getCategoryDef(prospect.category);
  const time = new Date(prospect.createdAt).toLocaleTimeString("pt-BR", { timeZone: SP_TZ, hour: "2-digit", minute: "2-digit" });
  return (
    <button
      type="button"
      onClick={() => onOpen(prospect)}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-brand-50/70"
    >
      <span className="text-xl" aria-hidden="true">{cat.icon}</span>
      <span className="min-w-0 flex-1 truncate font-medium text-ink">{prospect.name}</span>
      <span className="shrink-0 text-xs tabular-nums text-ink-faint">{time}</span>
    </button>
  );
}

/** Frases motivacionais para a conclusão do desafio (escolha determinística por semana). */
const MOTIVATIONAL_QUOTES = [
  "Cada “não” te aproxima do próximo “sim”. Siga firme!",
  "Consistência vence intensidade — e você provou isso.",
  "Grandes negócios nascem de conversas simples.",
  "Você plantou esta semana; a colheita já está a caminho.",
  "Disciplina é liberdade. Continue construindo o seu sonho.",
  "O mapa cresce a cada nome. Que semana!",
];

function incentiveFor(overallPct: number): string {
  if (overallPct <= 0) return "Vamos começar? O primeiro passo é o que mais importa.";
  if (overallPct < 0.5) return "Bom começo! Mantenha esse ritmo.";
  if (overallPct < 1) return "Você já passou da metade — falta pouco!";
  return "Tudo pronto por aqui!";
}

export default function DesafioPage() {
  const { ready, prospects, challenge, saveChallenge } = useProspects();
  const { openCreate, openDetail } = useProspectForm();
  const stats = useMemo(() => computeStats(prospects), [prospects]);
  const registered = registeredThisWeek(prospects);

  const [editing, setEditing] = useState(false);
  const [goalCount, setGoalCount] = useState(challenge?.goalCount ?? 15);
  const [contactGoal, setContactGoal] = useState(challenge?.contactGoal ?? 5);
  const [filterDate, setFilterDate] = useState(() => spDateKey(new Date()));

  /** Prospectos agrupados por dia LOCAL de cadastro, dias mais recentes primeiro. */
  const groupedByDay = useMemo(() => {
    const map = new Map<string, Prospect[]>();
    for (const p of prospects) {
      const key = localDayKey(p.createdAt);
      const arr = map.get(key);
      if (arr) arr.push(p);
      else map.set(key, [p]);
    }
    return [...map.entries()]
      .map(([key, items]) => ({ key, items: [...items].sort((a, b) => registrationTime(b) - registrationTime(a)) }))
      .sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [prospects]);

  /** Prospectos do dia selecionado no filtro, do mais recente para o mais antigo. */
  const filteredList = useMemo(() => {
    if (!filterDate) return [];
    return prospects
      .filter((p) => localDayKey(p.createdAt) === filterDate)
      .sort((a, b) => registrationTime(b) - registrationTime(a));
  }, [prospects, filterDate]);

  if (!ready || !challenge) return <LoadingScreen />;

  const regPct = Math.min(1, registered / Math.max(1, challenge.goalCount));
  const contactPct = Math.min(1, stats.contactsThisWeek / Math.max(1, challenge.contactGoal));
  const regDone = registered >= challenge.goalCount;
  const contactDone = stats.contactsThisWeek >= challenge.contactGoal;
  const complete = regDone && contactDone;
  const quote = MOTIVATIONAL_QUOTES[challenge.week % MOTIVATIONAL_QUOTES.length];
  const incentive = incentiveFor((regPct + contactPct) / 2);

  async function save() {
    await saveChallenge({ ...challenge!, goalCount, contactGoal });
    setEditing(false);
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-6">
      <header className="reveal pt-2">
        <p className="font-hand text-2xl text-brand-500">Um passo de cada vez, toda semana.</p>
        <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">Desafio da semana {challenge.week}</h1>
        <p className="mt-1 text-xs text-ink-faint">
          O progresso abaixo conta apenas os cadastros e contatos <b className="text-ink-soft">desta semana</b> — ele zera a cada nova semana do calendário.
        </p>
        <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-brand-100/70 px-3 py-1 text-xs font-semibold text-brand-700">
          🗓️ {spNowLabel()} <span className="font-normal text-ink-faint">· horário de São Paulo</span>
        </p>
      </header>

      <GlassCard strong className="reveal p-6">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-around">
          <div className="flex flex-col items-center gap-2">
            <ProgressRing value={registered} max={challenge.goalCount} size={130} label={`${registered}/${challenge.goalCount}`} sub="prospectos" />
            <span className="text-sm font-semibold text-ink-soft">Registrar prospectos</span>
            {regDone && <span className="font-hand text-base text-emerald-600">🎉 Meta de cadastros batida!</span>}
          </div>
          <div className="flex flex-col items-center gap-2">
            <ProgressRing value={stats.contactsThisWeek} max={challenge.contactGoal} size={130} label={`${stats.contactsThisWeek}/${challenge.contactGoal}`} sub="contatos" />
            <span className="text-sm font-semibold text-ink-soft">Fazer contatos</span>
            {contactDone && <span className="font-hand text-base text-emerald-600">🎉 Meta de contatos batida!</span>}
          </div>
        </div>

        {complete ? (
          <div className="mt-6 rounded-2xl p-5 text-center ring-1 ring-emerald-300/50" style={{ background: "linear-gradient(135deg,rgba(34,197,94,.18),rgba(96,165,250,.18))" }}>
            <p className="font-display text-xl font-extrabold text-ink">🎉 Desafio concluído!</p>
            <p className="font-hand mt-1 text-xl text-brand-600">{quote}</p>
            <p className="mt-2 text-sm text-ink-soft">Excelente trabalho! O progresso zera automaticamente na próxima semana.</p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="font-hand text-xl text-brand-500">{incentive}</p>
            <button className="btn btn-primary" onClick={() => openCreate()}>+ Registrar prospecto</button>
          </div>
        )}

        <div className="mt-5 border-t border-brand-100/70 pt-4">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <label className="label !mb-0" htmlFor="ver-cadastros-dia">Ver cadastros do dia</label>
            <input
              id="ver-cadastros-dia"
              type="date"
              className="field !w-auto"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-ghost !py-1.5 !text-xs"
              onClick={() => setFilterDate(spDateKey(new Date()))}
            >
              Hoje
            </button>
            {filterDate && (
              <button
                type="button"
                className="btn btn-ghost !py-1.5 !text-xs"
                onClick={() => setFilterDate("")}
              >
                Limpar
              </button>
            )}
          </div>
          {filterDate && (
            <p className="mt-2 text-center text-xs text-ink-faint">
              {filteredList.length} {filteredList.length === 1 ? "cadastro" : "cadastros"} em {formatDayShort(filterDate)} — detalhes em “Cadastros por data”.
            </p>
          )}
        </div>
      </GlassCard>

      <GlassCard className="reveal p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-ink">Metas da semana</h2>
          {!editing && <button className="btn btn-ghost !py-1.5 !text-xs" onClick={() => setEditing(true)}>Ajustar</button>}
        </div>
        {editing ? (
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="label">Prospectos</label>
              <input type="number" min={1} className="field !w-28" value={goalCount} onChange={(e) => setGoalCount(Math.max(1, Number(e.target.value)))} />
            </div>
            <div>
              <label className="label">Contatos</label>
              <input type="number" min={1} className="field !w-28" value={contactGoal} onChange={(e) => setContactGoal(Math.max(1, Number(e.target.value)))} />
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={save}>Salvar</button>
              <button className="btn btn-ghost" onClick={() => { setEditing(false); setGoalCount(challenge.goalCount); setContactGoal(challenge.contactGoal); }}>Cancelar</button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">Meta: registrar <b className="text-ink">{challenge.goalCount}</b> prospectos e fazer <b className="text-ink">{challenge.contactGoal}</b> contatos nesta semana.</p>
        )}
      </GlassCard>

      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="reveal p-4 text-center"><div className="font-display text-2xl font-extrabold text-ink">{stats.total}</div><div className="text-xs text-ink-faint">Total no mapa</div></GlassCard>
        <GlassCard className="reveal p-4 text-center"><div className="font-display text-2xl font-extrabold text-ink">{stats.favorites}</div><div className="text-xs text-ink-faint">Principais</div></GlassCard>
        <GlassCard className="reveal p-4 text-center"><div className="font-display text-2xl font-extrabold text-ink">{stats.hot}</div><div className="text-xs text-ink-faint">Muito interessados</div></GlassCard>
      </div>

      <GlassCard className="reveal p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-ink">Cadastros por data</h2>
            <p className="mt-1 text-xs text-ink-faint">Escolha um dia ou veja todos os prospectos agrupados por data de cadastro.</p>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <label className="label" htmlFor="filtro-data">Filtrar por dia</label>
              <input
                id="filtro-data"
                type="date"
                className="field !w-auto"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-ghost !py-1.5 !text-xs"
              onClick={() => setFilterDate(spDateKey(new Date()))}
            >
              Hoje
            </button>
            {filterDate && (
              <button type="button" className="btn btn-ghost !py-1.5 !text-xs" onClick={() => setFilterDate("")}>Limpar</button>
            )}
          </div>
        </div>

        {filterDate ? (
          <div className="mt-4">
            <p className="text-sm font-semibold text-ink-soft">
              {filteredList.length} {filteredList.length === 1 ? "prospecto cadastrado" : "prospectos cadastrados"} em {formatDayShort(filterDate)}
            </p>
            {filteredList.length === 0 ? (
              <p className="mt-3 text-sm text-ink-faint">Nenhum prospecto cadastrado nesse dia.</p>
            ) : (
              <div className="mt-2 max-h-96 space-y-1 overflow-auto pr-1">
                {filteredList.map((p) => (
                  <RegistrationItem key={p.id} prospect={p} onOpen={openDetail} />
                ))}
              </div>
            )}
          </div>
        ) : groupedByDay.length === 0 ? (
          <p className="mt-4 text-sm text-ink-faint">Nenhum prospecto cadastrado ainda.</p>
        ) : (
          <div className="mt-4 max-h-96 space-y-4 overflow-auto pr-1">
            {groupedByDay.map((group) => (
              <div key={group.key}>
                <div className="sticky top-0 mb-1 flex items-center gap-2 bg-transparent">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">{formatDayLong(group.key)}</span>
                  <span className="chip !py-0.5 !text-[11px]">{group.items.length}</span>
                </div>
                <div className="space-y-1">
                  {group.items.map((p) => (
                    <RegistrationItem key={p.id} prospect={p} onOpen={openDetail} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
