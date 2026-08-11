"use client";

import { useEffect } from "react";
import type { Intimacy, FunnelStatus } from "@/lib/types";
import { INTIMACY, getIntimacyDef, getStatusDef, INTEREST_LABELS } from "@/lib/taxonomy";

/* ---------------- Glass card ---------------- */
export function GlassCard({
  children,
  className = "",
  strong = false,
  hover = false,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  strong?: boolean;
  hover?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={`${strong ? "glass-strong" : "glass"} ${hover ? "glass-hover" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------------- Star rating ---------------- */
export function StarRating({
  value,
  onChange,
  size = 22,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-0.5" role="group" aria-label="Nível de interesse">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            aria-label={`${n} — ${INTEREST_LABELS[n - 1]}`}
            title={INTEREST_LABELS[n - 1]}
            onClick={() => onChange?.(n === value ? n - 1 : n)}
            className={readOnly ? "cursor-default" : "cursor-pointer transition-transform hover:scale-125"}
            style={{ lineHeight: 0, background: "none", border: "none", padding: 1 }}
          >
            <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? "#f59e0b" : "none"} stroke={active ? "#f59e0b" : "#9db3d8"} strokeWidth="1.6">
              <path strokeLinejoin="round" d="M12 3.5l2.6 5.27 5.82.85-4.21 4.1.99 5.8L12 16.8l-5.2 2.72.99-5.8-4.21-4.1 5.82-.85L12 3.5z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Intimacy picker / dots ---------------- */
export function IntimacyDots({ value }: { value: Intimacy }) {
  return (
    <div className="inline-flex items-center gap-1" title={getIntimacyDef(value).label}>
      {INTIMACY.map((i) => (
        <span
          key={i.id}
          className="inline-block rounded-full transition-all"
          style={{
            width: 12,
            height: 12,
            border: `2px solid ${i.color}`,
            background: i.id === value ? i.color : "transparent",
            boxShadow: i.id === value ? `0 0 0 3px ${i.color}22` : "none",
          }}
        />
      ))}
    </div>
  );
}

export function IntimacyPicker({
  value,
  onChange,
}: {
  value: Intimacy;
  onChange: (v: Intimacy) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {INTIMACY.map((i) => {
        const active = i.id === value;
        return (
          <button
            key={i.id}
            type="button"
            onClick={() => onChange(i.id)}
            className="chip transition-all"
            style={{
              borderColor: active ? i.color : "rgba(37,99,235,0.15)",
              background: active ? `${i.color}1a` : "rgba(255,255,255,0.55)",
              color: active ? i.color : "var(--ink-soft)",
              fontWeight: active ? 700 : 600,
            }}
          >
            <span className="inline-block rounded-full" style={{ width: 9, height: 9, background: i.color }} />
            {i.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Status badge ---------------- */
export function StatusBadge({ status }: { status: FunnelStatus }) {
  const s = getStatusDef(status);
  return (
    <span className="chip" style={{ background: s.bg, color: s.color, borderColor: `${s.color}33` }}>
      {s.label}
    </span>
  );
}

/* ---------------- Drawer (right side) ---------------- */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end p-2">
      <div
        className="absolute inset-0 bg-[#0b1c3f]/30 backdrop-blur-sm"
        style={{ animation: "floatUp .3s ease" }}
        onClick={onClose}
      />
      <aside
        className="glass-strong relative flex h-full w-full max-w-lg flex-col overflow-hidden"
        style={{ borderRadius: 24, animation: "floatUp .35s cubic-bezier(.22,1,.36,1)" }}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/60 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="btn btn-ghost !px-2.5 !py-2" aria-label="Fechar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <footer className="shrink-0 border-t border-white/60 px-5 py-3.5">{footer}</footer>}
      </aside>
    </div>
  );
}

/* ---------------- Confirm dialog ---------------- */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  onConfirm,
  onCancel,
  danger = false,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b1c3f]/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="glass-strong relative w-full max-w-sm p-6" style={{ animation: "floatUp .3s ease" }}>
        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-ink-soft">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Empty state ---------------- */
export function EmptyState({
  icon = "🗺️",
  title,
  message,
  action,
}: {
  icon?: string;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl text-3xl glass">{icon}</div>
      <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
      <p className="max-w-sm text-sm text-ink-soft">{message}</p>
      {action}
    </div>
  );
}

/* ---------------- Progress ring ---------------- */
export function ProgressRing({
  value,
  max,
  size = 92,
  label,
  sub,
}: {
  value: number;
  max: number;
  size?: number;
  label?: string;
  sub?: string;
}) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(37,99,235,0.14)" strokeWidth={8} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringgrad)"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset .8s cubic-bezier(.22,1,.36,1)" }}
        />
        <defs>
          <linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2563eb" />
            <stop offset="1" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-lg font-extrabold leading-none text-ink">{label}</div>
        {sub && <div className="text-[10px] font-semibold text-ink-faint">{sub}</div>}
      </div>
    </div>
  );
}
