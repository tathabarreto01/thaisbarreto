"use client";

import { useEffect, useMemo, useState } from "react";
import { useProspects } from "@/lib/store";
import { computeStats, contactsOnDay, totalContacts, spDateKey, spNowLabel, SP_TZ } from "@/lib/derive";
import { getCategoryDef } from "@/lib/taxonomy";
import type { Prospect } from "@/lib/types";
import { GlassCard, ProgressRing, LoadingScreen } from "@/components/ui";
import { useProspectForm } from "@/components/shell";

/** Chave `YYYY-MM-DD` do dia do cadastro, no fuso de São Paulo. */
function localDayKey(iso: string): string {
  return spDateKey(iso);
}

/** Rótulo por extenso: "12 de agosto de 2026". */
function formatDayLong(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

/** Rótulo curto: "02/09". */
function formatDayShort(key: string): string {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
}

/** Rótulo com dia da semana: "domingo, 30 de agosto de 2026". */
function formatDayFull(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Move uma chave `YYYY-MM-DD` em `delta` dias sem depender do fuso do
 * dispositivo (a aritmética é feita em UTC, então nunca "pula" um dia).
 */
function shiftDayKey(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

/** "30/08/2026 · 14:32" — data e hora do cadastro no fuso de São Paulo. */
function formatRegisteredAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("pt-BR", { timeZone: SP_TZ, day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("pt-BR", { timeZone: SP_TZ, hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

function registrationTime(p: Prospect): number {
  return new Date(p.createdAt).getTime();
}

function RegistrationItem({ prospect, onOpen }: { prospect: Prospect; onOpen: (p: Prospect) => void }) {
  const cat = getCategoryDef(prospect.category);
  const stamp = formatRegisteredAt(prospect.createdAt);
  return (
    <button
      type="button"
      onClick={() => onOpen(prospect)}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-brand-50/70"
    >
      <span className="text-xl" aria-hidden="true">{cat.icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-ink">{prospect.name}</span>
        <span className="mt-0.5 block text-[11px] tabular-nums text-ink-faint sm:hidden">Registrado em {stamp}</span>
      </span>
      <span className="hidden shrink-0 text-xs tabular-nums text-ink-faint sm:block" title={`Registrado em ${stamp}`}>
        {stamp}
      </span>
    </button>
  );
}

/**
 * Seletor de dia com navegação: ‹ [data] › · Hoje · Total.
 * Quando `value` está vazio, a tela está no modo "Total" (sem recorte de dia)
 * e a navegação parte do dia de hoje (SP).
 */
function DayNavigator({ id, value, today, onChange }: { id: string; value: string; today: string; onChange: (next: string) => void }) {
  const base = value || today;
  const atToday = base >= today;
  const isToday = value === today;
  const isTotal = !value;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Dia anterior"
          title={value ? "Dia anterior" : "Ver o dia anterior a hoje"}
          className="btn btn-ghost !px-3 !py-1.5 !text-sm"
          onClick={() => onChange(shiftDayKey(base, -1))}
        >
          ‹
        </button>
        <input
          id={id}
          type="date"
          max={today}
          className="field !w-auto"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          aria-label="Próximo dia"
          title={atToday ? "Você já está no dia mais recente" : "Próximo dia"}
          disabled={atToday}
          className="btn btn-ghost !px-3 !py-1.5 !text-sm"
          onClick={() => onChange(shiftDayKey(base, 1))}
        >
          ›
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-pressed={isToday}
          title="Ver o dia de hoje"
          className={`btn !py-1.5 !text-xs ${isToday ? "btn-primary" : "btn-ghost"}`}
          onClick={() => onChange(today)}
        >
          Hoje
        </button>
        <button
          type="button"
          aria-pressed={isTotal}
          title="Ver todos os cadastros, agrupados por data"
          className={`btn !py-1.5 !text-xs ${isTotal ? "btn-primary" : "btn-ghost"}`}
          onClick={() => onChange("")}
        >
          Total
        </button>
      </div>
    </div>
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

  const [editing, setEditing] = useState(false);
  const [goalCount, setGoalCount] = useState(challenge?.goalCount ?? 60);
  const [contactGoal, setContactGoal] = useState(challenge?.contactGoal ?? 2);
  const [today, setToday] = useState(() => spDateKey(new Date()));
  const [filterDate, setFilterDate] = useState(today);

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

  /** Mantém "hoje" correto se a página ficar aberta durante a virada do dia. */
  useEffect(() => {
    const id = window.setInterval(() => setToday(spDateKey(new Date())), 60_000);
    return () => window.clearInterval(id);
  }, []);

  /** Contatos do recorte atual: do dia selecionado ou o total geral. */
  const contactCount = useMemo(
    () => (filterDate ? contactsOnDay(prospects, filterDate) : totalContacts(prospects)),
    [prospects, filterDate],
  );

  if (!ready || !challenge) return <LoadingScreen />;

  const totalProspects = stats.total;
  const regPct = Math.min(1, totalProspects / Math.max(1, challenge.goalCount));
  const contactPct = Math.min(1, contactCount / Math.max(1, challenge.contactGoal));
  const regDone = totalProspects >= challenge.goalCount;
  const contactDone = contactCount >= challenge.contactGoal;
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
        <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">Desafio da semana</h1>
        <p className="mt-1 text-xs text-ink-faint">
          O 1º anel mostra o <b className="text-ink-soft">total de prospectos</b> já cadastrados (nunca zera). O 2º acompanha os{" "}
          <b className="text-ink-soft">contatos do dia escolhido</b> abaixo — ou o total, no modo “Total”.
        </p>
        <p className="chip chip-brand chip-lg mt-1.5">
          🗓️ {spNowLabel()} <span className="font-normal text-ink-soft">· horário de São Paulo</span>
        </p>
      </header>

      <GlassCard strong className="reveal p-6">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          <div className="flex w-full flex-col items-center gap-2 sm:flex-1 sm:basis-0">
            <ProgressRing value={totalProspects} max={challenge.goalCount} size={130} label={`${totalProspects}/${challenge.goalCount}`} sub="prospectos" />
            <span className="text-sm font-semibold text-ink-soft">Total de Prospectos</span>
            <span className="text-center text-[11px] leading-4 text-ink-faint sm:min-h-8">acumulado geral · meta {challenge.goalCount}</span>
            <span
              className={`font-hand text-base leading-6 text-emerald-600 ${regDone ? "" : "hidden sm:block sm:min-h-6"}`}
              aria-hidden={regDone ? undefined : true}
            >
              {regDone ? "🎉 Meta de cadastros batida!" : null}
            </span>
          </div>
          <div className="flex w-full flex-col items-center gap-2 sm:flex-1 sm:basis-0">
            <ProgressRing
              value={contactCount}
              max={challenge.contactGoal}
              size={130}
              label={`${contactCount}/${challenge.contactGoal}`}
              sub={filterDate ? formatDayShort(filterDate) : "total"}
            />
            <span className="text-sm font-semibold text-ink-soft">Fazer contatos</span>
            <span className="text-center text-[11px] leading-4 text-ink-faint sm:min-h-8">
              {filterDate ? `contatos em ${formatDayShort(filterDate)}` : "contatos (total)"}
            </span>
            <span
              className={`font-hand text-base leading-6 text-emerald-600 ${contactDone ? "" : "hidden sm:block sm:min-h-6"}`}
              aria-hidden={contactDone ? undefined : true}
            >
              {contactDone ? "🎉 Meta de contatos batida!" : null}
            </span>
          </div>
        </div>

        {complete ? (
          <div className="mt-6 rounded-2xl p-5 text-center ring-1 ring-emerald-300/50" style={{ background: "linear-gradient(135deg,rgba(34,197,94,.18),rgba(96,165,250,.18))" }}>
            <p className="font-display text-xl font-extrabold text-ink">🎉 Desafio concluído!</p>
            <p className="font-hand mt-1 text-xl text-brand-600">{quote}</p>
            <p className="mt-2 text-sm text-ink-soft">Excelente trabalho! Escolha outro dia abaixo para acompanhar os contatos de outra data.</p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="font-hand text-xl text-brand-500">{incentive}</p>
            <button className="btn btn-primary" onClick={() => openCreate()}>+ Registrar prospecto</button>
          </div>
        )}

        <div className="mt-5 border-t border-brand-100/70 pt-4">
          <div className="flex flex-col items-center gap-2">
            <label className="label !mb-0" htmlFor="ver-cadastros-dia">Dia acompanhado</label>
            <DayNavigator id="ver-cadastros-dia" value={filterDate} today={today} onChange={setFilterDate} />
          </div>
          <p className="mt-2 text-center text-xs text-ink-faint">
            {filterDate ? (
              <>
                <b className="text-ink-soft">
                  {filteredList.length} {filteredList.length === 1 ? "cadastro" : "cadastros"}
                </b>{" "}
                e{" "}
                <b className="text-ink-soft">
                  {contactCount} {contactCount === 1 ? "contato" : "contatos"}
                </b>{" "}
                em {formatDayFull(filterDate)} — detalhes em “Cadastros por data”.
              </>
            ) : (
              <>
                Modo <b className="text-ink-soft">Total</b> — somando todos os dias. Use ‹ › ou “Hoje” para ver um dia específico.
              </>
            )}
          </p>
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
          <p className="mt-2 text-sm text-ink-soft">Meta: chegar a <b className="text-ink">{challenge.goalCount}</b> prospectos no mapa e fazer <b className="text-ink">{challenge.contactGoal}</b> contatos no dia acompanhado.</p>
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
            <p className="mt-1 text-xs text-ink-faint">
              {filterDate ? "Mostrando apenas o dia selecionado." : "Modo Total: todos os prospectos agrupados por data de cadastro."}
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <label className="label" htmlFor="filtro-data">Filtrar por dia</label>
            <DayNavigator id="filtro-data" value={filterDate} today={today} onChange={setFilterDate} />
          </div>
        </div>

        {filterDate ? (
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip chip-brand-strong !py-0.5 !text-[11px]">Dia selecionado</span>
              <span className="text-sm font-semibold text-ink-soft">
                {filteredList.length} {filteredList.length === 1 ? "prospecto cadastrado" : "prospectos cadastrados"} em {formatDayFull(filterDate)}
              </span>
            </div>
            {filteredList.length === 0 ? (
              <p className="mt-2 text-sm text-ink-faint">
                Nenhum prospecto cadastrado em {formatDayFull(filterDate)} — use ‹ › para navegar ou “Total” para ver todos.
              </p>
            ) : (
              <div className="mt-2 max-h-72 space-y-1 overflow-auto pr-1">
                {filteredList.map((p) => (
                  <RegistrationItem key={p.id} prospect={p} onOpen={openDetail} />
                ))}
              </div>
            )}
          </div>
        ) : groupedByDay.length === 0 ? (
          <p className="mt-4 text-sm text-ink-faint">Nenhum prospecto cadastrado ainda.</p>
        ) : (
          <div className="mt-4 max-h-96 space-y-3 overflow-auto pr-1">
            {groupedByDay.map((group) => (
              <section key={group.key} className="rounded-2xl px-2 py-2">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">{formatDayLong(group.key)}</span>
                  <span className="chip chip-brand !py-0.5 !text-[11px]">{group.items.length}</span>
                </div>
                <div className="space-y-1">
                  {group.items.map((p) => (
                    <RegistrationItem key={p.id} prospect={p} onOpen={openDetail} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
