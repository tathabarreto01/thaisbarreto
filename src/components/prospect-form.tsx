"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type {
  CategoryId,
  ContactLogEntry,
  Intimacy,
  Prospect,
  ProspectDraft,
} from "@/lib/types";
import { CATEGORIES, getCategoryDef, CHANNELS, STATUSES, MOTIVATIONS, MOTIVATION_OTHER, NEXT_STEPS } from "@/lib/taxonomy";
import { useProspects } from "@/lib/store";
import { useDebouncedValidation } from "@/lib/use-validation";
import { Drawer, IntimacyPicker, StarRating } from "./ui";

/* ---------------- Validation contracts (espelham as rotas /api/validate/*) ---------------- */
interface EmailValidation {
  valid: boolean;
  deliverable: boolean;
  reason?: "formato" | "sem_mx" | "dominio_inexistente";
  domain?: string;
}
interface PhoneValidation {
  valid: boolean;
  e164?: string;
  national?: string;
  international?: string;
  isMobile?: boolean;
  country?: string | null;
}
interface CityMatch {
  name: string;
  uf: string;
  label: string;
}
interface CityValidation {
  matches: CityMatch[];
  exact: boolean;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

async function fetchEmail(email: string, signal: AbortSignal): Promise<EmailValidation> {
  const res = await fetch("/api/validate/email", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email }),
    signal,
  });
  return res.json() as Promise<EmailValidation>;
}

async function fetchPhone(phone: string, signal: AbortSignal): Promise<PhoneValidation> {
  const res = await fetch("/api/validate/phone", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ phone }),
    signal,
  });
  return res.json() as Promise<PhoneValidation>;
}

async function fetchCity(q: string, signal: AbortSignal): Promise<CityValidation> {
  const res = await fetch(`/api/validate/city?q=${encodeURIComponent(q)}`, { signal });
  return res.json() as Promise<CityValidation>;
}

/* ---------------- Inline status note ---------------- */
type Tone = "ok" | "warn" | "error" | "loading";

const TONE_COLOR: Record<Tone, string> = {
  ok: "#16a34a",
  warn: "#d97706",
  error: "#dc2626",
  loading: "var(--ink-faint)",
};

function ToneIcon({ tone }: { tone: Tone }) {
  if (tone === "loading") {
    return (
      <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  if (tone === "ok") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (tone === "error") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" />
        <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 2 20h20L12 3Z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" />
      <path d="M12 10v4M12 17h.01" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

function FieldNote({ id, tone, children }: { id?: string; tone: Tone; children: React.ReactNode }) {
  return (
    <p
      id={id}
      aria-live="polite"
      className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium"
      style={{ color: TONE_COLOR[tone] }}
    >
      <ToneIcon tone={tone} />
      <span>{children}</span>
    </p>
  );
}

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
  motivations: string[];
  interestNotes: string;
  nextStep: string;
  nextStepDate: string;
};

function blank(preset?: Props["preset"]): FormState {
  const category = preset?.category ?? "familia";
  return {
    name: "",
    category,
    subcategory: preset?.subcategory ?? getCategoryDef(category).subcategories[0] ?? "",
    intimacy: "muito_proximo",
    interest: 0,
    status: "novo",
    phone: "",
    email: "",
    city: "",
    motivations: [],
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
    motivations: p.motivations ?? [],
    interestNotes: p.interestNotes ?? "",
    nextStep: p.nextStep ?? "",
    nextStepDate: p.nextStepDate ? p.nextStepDate.slice(0, 10) : "",
  };
}

export function ProspectForm({ open, editing, preset, onClose, onCreate, onUpdate }: Props) {
  const [form, setForm] = useState<FormState>(blank(preset));
  const [saving, setSaving] = useState(false);

  // Nome não-semântico e estável (SSR-safe) para o Chrome/gerenciadores de senha
  // não casarem heurísticas de endereço/telefone/e-mail e dispararem o autofill nativo.
  const uid = useId().replace(/[:]/g, "");
  const noAutofill = {
    autoComplete: "off",
    autoCorrect: "off",
    autoCapitalize: "off",
    spellCheck: false,
    "data-lpignore": "true",
    "data-1p-ignore": "",
    "data-form-type": "other",
  } as const;

  useEffect(() => {
    if (!open) return;
    setForm(editing ? fromProspect(editing) : blank(preset));
  }, [open, editing, preset]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleMotivation = (option: string) =>
    setForm((f) => ({
      ...f,
      motivations: f.motivations.includes(option)
        ? f.motivations.filter((m) => m !== option)
        : [...f.motivations, option],
    }));

  const subcats = getCategoryDef(form.category).subcategories;

  /* -------- Assistive validation (não bloqueia o salvamento) -------- */
  const emailVal = useDebouncedValidation<EmailValidation>({
    value: form.email,
    enabled: form.email.trim().length > 0,
    fetcher: fetchEmail,
  });
  const phoneVal = useDebouncedValidation<PhoneValidation>({
    value: form.phone,
    enabled: form.phone.trim().length > 0,
    fetcher: fetchPhone,
  });
  const cityVal = useDebouncedValidation<CityValidation>({
    value: form.city,
    enabled: form.city.trim().length >= 2,
    fetcher: fetchCity,
  });

  // Cidade: autocomplete flutuante.
  const cityMatches = cityVal.status === "done" ? cityVal.data.matches : [];
  const [cityOpen, setCityOpen] = useState(false);
  const [cityActive, setCityActive] = useState(-1);
  const cityBoxRef = useRef<HTMLDivElement>(null);

  const selectCity = (label: string) => {
    set("city", label);
    setCityOpen(false);
    setCityActive(-1);
  };

  // Fecha o dropdown ao clicar fora.
  useEffect(() => {
    if (!cityOpen) return;
    const onDown = (e: MouseEvent) => {
      if (cityBoxRef.current && !cityBoxRef.current.contains(e.target as Node)) setCityOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [cityOpen]);

  // Telefone: ao sair do campo, aplica o formato nacional se validado com sucesso.
  const applyPhoneFormat = () => {
    const d = phoneVal.status === "done" ? phoneVal.data : null;
    if (d?.valid && d.national && d.national !== form.phone) set("phone", d.national);
  };

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
      motivations: form.motivations,
      interestNotes: form.motivations.includes(MOTIVATION_OTHER)
        ? form.interestNotes.trim() || undefined
        : undefined,
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
              setForm((f) => ({ ...f, category: c, subcategory: getCategoryDef(c).subcategories[0] ?? "" }));
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

        <div>
          <label className="label" htmlFor="prospect-phone">Telefone / WhatsApp</label>
          <input
            id="prospect-phone"
            name={`mp-phone-${uid}`}
            className="field"
            inputMode="tel"
            placeholder="(00) 00000-0000"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            onBlur={applyPhoneFormat}
            aria-describedby="prospect-phone-note"
            {...noAutofill}
          />
          {phoneVal.status === "loading" && <FieldNote id="prospect-phone-note" tone="loading">Validando telefone…</FieldNote>}
          {phoneVal.status === "done" && !phoneVal.data.valid && (
            <FieldNote id="prospect-phone-note" tone="warn">Telefone não reconhecido</FieldNote>
          )}
          {phoneVal.status === "done" && phoneVal.data.valid && (
            <FieldNote id="prospect-phone-note" tone="ok">
              {phoneVal.data.national}
              {phoneVal.data.isMobile && (
                <span className="ml-1.5 text-ink-soft">📱 Celular · WhatsApp</span>
              )}
            </FieldNote>
          )}
        </div>

        <div>
          <div ref={cityBoxRef} className="relative">
          <label className="label" htmlFor="prospect-city">Cidade</label>
          <input
            id="prospect-city"
            name={`mp-city-${uid}`}
            className="field"
            placeholder="Cidade / UF"
            value={form.city}
            role="combobox"
            aria-expanded={cityOpen && cityMatches.length > 0}
            aria-controls="prospect-city-list"
            aria-describedby="prospect-city-note"
            aria-autocomplete="list"
            {...noAutofill}
            onChange={(e) => {
              set("city", e.target.value);
              setCityOpen(true);
              setCityActive(-1);
            }}
            onFocus={() => cityMatches.length > 0 && setCityOpen(true)}
            onKeyDown={(e) => {
              if (!cityOpen || cityMatches.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCityActive((i) => Math.min(i + 1, cityMatches.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCityActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && cityActive >= 0) {
                e.preventDefault();
                selectCity(cityMatches[cityActive].label);
              } else if (e.key === "Escape") {
                setCityOpen(false);
              }
            }}
          />
          {cityOpen && cityMatches.length > 0 && (
            <ul
              id="prospect-city-list"
              role="listbox"
              className="glass-strong absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto p-1"
            >
                {cityMatches.map((m, i) => (
                  <li
                    key={m.label}
                    role="option"
                    aria-selected={i === cityActive}
                    className="cursor-pointer rounded-lg px-3 py-1.5 text-sm text-ink"
                    style={{ background: i === cityActive ? "rgba(37,99,235,.12)" : "transparent" }}
                    onMouseEnter={() => setCityActive(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectCity(m.label);
                    }}
                  >
                    {m.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
            {cityVal.status === "loading" && <FieldNote id="prospect-city-note" tone="loading">Buscando cidade…</FieldNote>}
            {cityVal.status === "done" && cityVal.data.exact && (
              <FieldNote id="prospect-city-note" tone="ok">Cidade válida</FieldNote>
            )}
            {cityVal.status === "done" && !cityVal.data.exact && cityMatches.length === 0 && (
              <FieldNote id="prospect-city-note" tone="warn">Cidade não encontrada</FieldNote>
            )}
            {cityVal.status === "done" && !cityVal.data.exact && cityMatches.length > 0 && (
              <FieldNote id="prospect-city-note" tone="loading">Selecione uma cidade da lista</FieldNote>
            )}
          </div>

        <div>
          <label className="label" htmlFor="prospect-email">E-mail</label>
          <input
            id="prospect-email"
            name={`mp-email-${uid}`}
            className="field"
            type="email"
            placeholder="email@exemplo.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            aria-describedby="prospect-email-note"
            aria-invalid={emailVal.status === "done" && !emailVal.data.valid}
            {...noAutofill}
          />
          {emailVal.status === "loading" && <FieldNote id="prospect-email-note" tone="loading">Validando e-mail…</FieldNote>}
          {emailVal.status === "done" && !emailVal.data.valid && (
            <FieldNote id="prospect-email-note" tone="error">E-mail inválido</FieldNote>
          )}
          {emailVal.status === "done" && emailVal.data.valid && emailVal.data.deliverable && (
            <FieldNote id="prospect-email-note" tone="ok">E-mail válido</FieldNote>
          )}
          {emailVal.status === "done" && emailVal.data.valid && !emailVal.data.deliverable && (
            <FieldNote id="prospect-email-note" tone="warn">Domínio pode não receber e-mails</FieldNote>
          )}
        </div>

        <div>
          <label className="label">Fatores de Motivação</label>
          <div className="flex flex-wrap gap-2">
            {MOTIVATIONS.map((option) => {
              const active = form.motivations.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleMotivation(option)}
                  aria-pressed={active}
                  className="chip cursor-pointer select-none"
                  style={{
                    background: active ? "rgba(219,234,254,.85)" : "rgba(255,255,255,.55)",
                    color: active ? "var(--brand-700, #1d4ed8)" : "var(--ink-soft)",
                    borderColor: active ? "rgba(37,99,235,.4)" : "rgba(37,99,235,.15)",
                    fontWeight: active ? 700 : 600,
                  }}
                >
                  {active && <span aria-hidden="true">✓ </span>}
                  {option}
                </button>
              );
            })}
          </div>
          {form.motivations.includes(MOTIVATION_OTHER) && (
            <textarea
              className="field mt-2"
              rows={2}
              placeholder="Descreva o outro fator de motivação…"
              value={form.interestNotes}
              onChange={(e) => set("interestNotes", e.target.value)}
            />
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <label className="label" htmlFor="prospect-nextstep">Próximo passo</label>
            <select id="prospect-nextstep" className="field" value={form.nextStep} onChange={(e) => set("nextStep", e.target.value)}>
              <option value="">Selecione o próximo passo…</option>
              {NEXT_STEPS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              {form.nextStep && !NEXT_STEPS.includes(form.nextStep) && (
                <option value={form.nextStep}>{form.nextStep}</option>
              )}
            </select>
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
