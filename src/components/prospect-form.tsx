"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CategoryId,
  ContactLogEntry,
  Intimacy,
  Prospect,
  ProspectDraft,
} from "@/lib/types";
import { CATEGORIES, CATEGORY_MAP, CHANNELS, STATUSES } from "@/lib/taxonomy";
import { useProspects } from "@/lib/store";
import { Drawer, IntimacyPicker, StarRating } from "./ui";

interface Props {
  open: boolean;
  editing: Prospect | null;
  preset?: { category?: CategoryId; subcategory?: string };
  onClose: () => void;
  onCreate: (draft: ProspectDraft) => Promise<Prospect>;
  onUpdate: (id: string, patch: Partial<Prospect>) => Promise<Prospect>;
}

type FormState = {
  name: string;
  category: CategoryId;
  subcategory: string;
  intimacy: Intimacy;
  interest: number;
  status: Prospect["status"];
  phone: string;
  email: string;
  city: string;
  interestNotes: string;
  nextStep: string;
  nextStepDate: string;
};

function blank(preset?: Props["preset"]): FormState {
  const category = preset?.category ?? "familia";
  return {
    name: "",
    category,
    subcategory: preset?.subcategory ?? CATEGORY_MAP[category].subcategories[0],
    intimacy: "muito_proximo",
    interest: 0,
    status: "novo",
    phone: "",
    email: "",
    city: "",
    interestNotes: "",
    nextStep: "",
    nextStepDate: "",
  };
}

function fromProspect(p: Prospect): FormState {
  return {
    name: p.name,
    category: p.category,
    subcategory: p.subcategory,
    intimacy: p.intimacy,
    interest: p.interest,
    status: p.status,
    phone: p.phone ?? "",
    email: p.email ?? "",
    city: p.city ?? "",
    interestNotes: p.interestNotes ?? "",
    nextStep: p.nextStep ?? "",
    nextStepDate: p.nextStepDate ? p.nextStepDate.slice(0, 10) : "",
  };
}

export function ProspectForm({ open, editing, preset, onClose, onCreate, onUpdate }: Props) {
  const [form, setForm] = useState<FormState>(blank(preset));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? fromProspect(editing) : blank(preset));
  }, [open, editing, preset]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const subcats = CATEGORY_MAP[form.category].subcategories;

  const draft: ProspectDraft = useMemo(
    () => ({
      name: form.name,
      category: form.category,
      subcategory: form.subcategory,
      intimacy: form.intimacy,
      interest: form.interest,
      status: form.status,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      city: form.city.trim() || undefined,
      interestNotes: form.interestNotes.trim() || undefined,
      nextStep: form.nextStep.trim() || undefined,
      nextStepDate: form.nextStepDate ? new Date(form.nextStepDate).toISOString() : undefined,
    }),
    [form],
  );

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) await onUpdate(editing.id, draft);
      else await onCreate(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Editar prospecto" : "Novo prospecto"}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!form.name.trim() || saving}>
            {saving ? "Salvando…" : editing ? "Salvar alterações" : "Adicionar prospecto"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <label className="label">Nome *</label>
          <input className="field" autoFocus placeholder="Nome completo" value={form.name} onChange={(e) => set("name", e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSave()} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Categoria</label>
            <select className="field" value={form.category} onChange={(e) => {
              const c = e.target.value as CategoryId;
              setForm((f) => ({ ...f, category: c, subcategory: CATEGORY_MAP[c].subcategories[0] }));
            }}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Origem</label>
            <select className="field" value={form.subcategory} onChange={(e) => set("subcategory", e.target.value)}>
              {subcats.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Nível de intimidade</label>
          <IntimacyPicker value={form.intimacy} onChange={(v) => set("intimacy", v)} />
        </div>

        <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,.45)" }}>
          <span className="label !mb-0">Nível de interesse</span>
          <StarRating value={form.interest} onChange={(v) => set("interest", v)} size={26} />
        </div>

        <div>
          <label className="label">Status no funil</label>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => {
              const active = s.id === form.status;
              return (
                <button key={s.id} type="button" onClick={() => set("status", s.id)} className="chip" style={{ background: active ? s.bg : "rgba(255,255,255,.55)", color: active ? s.color : "var(--ink-soft)", borderColor: active ? `${s.color}55` : "rgba(37,99,235,.15)", fontWeight: active ? 700 : 600 }}>{s.label}</button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Telefone / WhatsApp</label>
            <input className="field" inputMode="tel" placeholder="(00) 00000-0000" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <label className="label">Cidade</label>
            <input className="field" placeholder="Cidade / UF" value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">E-mail</label>
          <input className="field" type="email" placeholder="email@exemplo.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>

        <div>
          <label className="label">Pelo que ele pode se interessar?</label>
          <textarea className="field" rows={2} placeholder="Renda extra, produtos de bem-estar, empreender…" value={form.interestNotes} onChange={(e) => set("interestNotes", e.target.value)} />
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <label className="label">Próximo passo</label>
            <input className="field" placeholder="Ex.: convidar para um café" value={form.nextStep} onChange={(e) => set("nextStep", e.target.value)} />
          </div>
          <div>
            <label className="label">Data</label>
            <input className="field" type="date" value={form.nextStepDate} onChange={(e) => set("nextStepDate", e.target.value)} />
          </div>
        </div>

        {editing && <ContactHistory prospect={editing} />}
      </div>
    </Drawer>
  );
}

/* ---------------- Contact history (edit mode) ---------------- */
function ContactHistory({ prospect }: { prospect: Prospect }) {
  const { addContact } = useProspects();
  const [channel, setChannel] = useState<ContactLogEntry["channel"]>("whatsapp");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!note.trim()) return;
    setBusy(true);
    try {
      await addContact(prospect.id, { date: new Date().toISOString(), channel, note: note.trim() });
      setNote("");
    } finally {
      setBusy(false);
    }
  }

  const history = prospect.history ?? [];

  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,.4)" }}>
      <div className="label">Histórico de contatos</div>
      <div className="flex items-end gap-2">
        <select className="field !w-auto" value={channel} onChange={(e) => setChannel(e.target.value as ContactLogEntry["channel"])}>
          {Object.entries(CHANNELS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <input className="field" placeholder="Registrar um contato…" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button className="btn btn-primary !px-3" onClick={add} disabled={busy || !note.trim()}>+</button>
      </div>
      {history.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {history.map((h) => (
            <li key={h.id} className="flex items-start gap-2 rounded-xl bg-white/55 px-3 py-2 text-sm">
              <span>{CHANNELS[h.channel]?.icon ?? "•"}</span>
              <div className="min-w-0 flex-1">
                <p className="text-ink">{h.note}</p>
                <p className="text-[11px] text-ink-faint">{new Date(h.date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
