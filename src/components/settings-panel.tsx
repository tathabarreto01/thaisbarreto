"use client";

import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Drawer, ThemeToggle } from "./ui";

const CLOUD = isSupabaseConfigured();

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-[11px] font-bold uppercase tracking-[.14em] text-ink-faint">{title}</h3>
      {children}
    </section>
  );
}

export function SettingsPanel({
  open,
  onClose,
  empty,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  empty: boolean;
  onClear: () => void;
}) {
  const auth = useAuth();
  const email = auth.user?.email ?? "";

  return (
    <Drawer open={open} onClose={onClose} title="Configurações">
      <div className="flex flex-col gap-7">
        {CLOUD && (
          <Section title="Conta">
            <div className="flex items-center gap-3 rounded-xl px-3 py-3" style={{ background: "var(--w40)" }}>
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#2563eb,#60a5fa)" }}
                aria-hidden
              >
                {(email[0] ?? "?").toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink" title={email}>
                  {email || "Conectado"}
                </span>
                <span className="block text-[11px] font-semibold text-ink-faint">Sessão ativa nesta nuvem</span>
              </span>
              <button className="btn btn-ghost !px-3 !py-1.5 !text-[12px]" onClick={() => auth.signOut()} aria-label="Sair da conta">
                Sair
              </button>
            </div>
          </Section>
        )}

        <Section title="Aparência">
          <div className="flex flex-col gap-2 rounded-xl px-3 py-3" style={{ background: "var(--w40)" }}>
            <span className="text-[12px] font-semibold text-ink-soft">Tema</span>
            <ThemeToggle />
          </div>
        </Section>

        <Section title="Dados">
          <div className="flex flex-col gap-3 rounded-xl px-3 py-3" style={{ background: "var(--w40)" }}>
            <p className="text-[12px] leading-relaxed text-ink-soft">
              {CLOUD
                ? "Apaga todos os prospectos da sua conta, incluindo histórico e favoritos. Não é possível desfazer."
                : "💾 Dados salvos neste navegador (modo local). Limpar apaga todos os prospectos, histórico e favoritos. Não é possível desfazer."}
            </p>
            <button
              className="btn btn-danger w-full"
              disabled={empty}
              aria-label="Limpar todos os dados"
              onClick={() => {
                onClose();
                onClear();
              }}
            >
              {empty ? "Nenhum dado para limpar" : "🗑 Limpar todos os dados"}
            </button>
          </div>
        </Section>
      </div>
    </Drawer>
  );
}
