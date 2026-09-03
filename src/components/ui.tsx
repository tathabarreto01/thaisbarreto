"use client";

import { useEffect } from "react";
import type { Intimacy, FunnelStatus } from "@/lib/types";
import { INTIMACY, getIntimacyDef, getStatusDef, INTEREST_LABELS } from "@/lib/taxonomy";
import { useTheme } from "@/lib/theme";

/* ---------------- Theme toggle ---------------- */
export function ThemeToggle() {
  const { theme, mounted, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn btn-ghost w-full !justify-start gap-2.5 !py-2.5"
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      aria-pressed={mounted ? dark : undefined}
      title={dark ? "Modo claro" : "Modo escuro"}
    >
      <span className="grid h-6 w-6 place-items-center" aria-hidden>
        {mounted && dark ? (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </span>
      <span className="text-[13px] font-semibold">
        {mounted ? (dark ? "Modo claro" : "Modo escuro") : "Tema"}
      </span>
    </button>
  );
}

/* ---------------- Glass card ---------------- */
/* ---------------- Ícone oficial do WhatsApp ---------------- */
/** Glifo da marca WhatsApp (viewBox 24). `currentColor` por padrão para herdar
 *  a cor do botão; passe `brand` para usar o verde oficial (#25D366). */
export function WhatsAppIcon({ size = 15, brand = false }: { size?: number; brand?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={brand ? "#25D366" : "currentColor"}
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

/* ---------------- Ícone oficial do Instagram ---------------- */
/** Glifo da marca Instagram (viewBox 24). `brand` usa o rosa oficial (#E4405F);
 *  sem ele herda `currentColor`, para acompanhar a cor do chip/botão. */
export function InstagramIcon({ size = 15, brand = false }: { size?: number; brand?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={brand ? "#E4405F" : "currentColor"}
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm7.846-10.405a1.441 1.441 0 0 1-2.88 0 1.44 1.44 0 0 1 2.88 0z" />
    </svg>
  );
}

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
              borderColor: active ? i.color : "var(--chip-muted-border)",
              background: active ? `${i.color}1a` : "var(--w55)",
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

/* ---------------- Drawer (painel centralizado) ---------------- */
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-[#0b1c3f]/30 backdrop-blur-sm"
        style={{ animation: "floatUp .3s ease" }}
        onClick={onClose}
      />
      <aside
        className="glass-strong relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden"
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

/* ---------------- Loading skeleton ---------------- */
/* Fica aqui (e nao em app/page.tsx) para que as demais rotas nao precisem
   arrastar o modulo inteiro do Painel so por causa deste esqueleto. */
export function LoadingScreen() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid grid-cols-2 gap-3 pt-8 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass shimmer h-20" />)}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="glass shimmer h-40" />
        <div className="glass shimmer h-40 lg:col-span-2" />
      </div>
    </div>
  );
}
