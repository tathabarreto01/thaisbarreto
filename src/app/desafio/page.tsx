"use client";

import { useMemo, useState } from "react";
import { useProspects } from "@/lib/store";
import { computeStats, registeredThisWeek } from "@/lib/derive";
import { GlassCard, ProgressRing } from "@/components/ui";
import { useProspectForm } from "@/components/shell";
import { LoadingScreen } from "../page";

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
  const { openCreate } = useProspectForm();
  const stats = useMemo(() => computeStats(prospects), [prospects]);
  const registered = registeredThisWeek(prospects);

  const [editing, setEditing] = useState(false);
  const [goalCount, setGoalCount] = useState(challenge?.goalCount ?? 15);
  const [contactGoal, setContactGoal] = useState(challenge?.contactGoal ?? 5);

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
  async function nextWeek() {
    await saveChallenge({ week: challenge!.week + 1, goalCount, contactGoal, startedAt: new Date().toISOString() });
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-6">
      <header className="reveal pt-2">
        <p className="font-hand text-2xl text-brand-500">Um passo de cada vez, toda semana.</p>
        <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">Desafio da semana {challenge.week}</h1>
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
            <p className="mt-2 text-sm text-ink-soft">Excelente trabalho. Pronto para a próxima semana?</p>
            <button className="btn btn-primary mt-3" onClick={nextWeek}>Começar semana {challenge.week + 1} →</button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="font-hand text-xl text-brand-500">{incentive}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button className="btn btn-primary" onClick={() => openCreate()}>+ Registrar prospecto</button>
              <button className="btn btn-ghost" onClick={nextWeek}>Avançar semana →</button>
            </div>
          </div>
        )}
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
    </div>
  );
}
