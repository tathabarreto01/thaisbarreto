import { NextResponse } from "next/server";

// Keep-alive do Supabase (plano grátis pausa após 7 dias sem atividade).
// Chamado pela Vercel Cron (ver vercel.json) a cada 3 dias.
export const runtime = "nodejs";
// Nunca cachear/prerenderizar: precisa bater no banco a cada chamada.
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 10_000;

function fail(error: string) {
  // 503 para aparecer como falha nos logs da Vercel.
  return NextResponse.json({ ok: false, error }, { status: 503 });
}

export async function GET(req: Request) {
  // Se CRON_SECRET existir, exige o header que a Vercel Cron envia sozinha.
  // Sem CRON_SECRET, liberado: o endpoint só faz uma leitura inofensiva.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return fail("supabase_not_configured");

  try {
    // Consulta leve que executa no Postgres (com RLS volta [], tudo bem).
    const res = await fetch(`${url.replace(/\/+$/, "")}/rest/v1/prospects?select=id&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[keep-alive] Supabase respondeu HTTP ${res.status}`);
      return fail(`http_${res.status}`);
    }
    return NextResponse.json({ ok: true, status: res.status, checkedAt: new Date().toISOString() });
  } catch (err) {
    // Só o tipo do erro — nada de URL/chaves no log.
    const name = err instanceof Error ? err.name : "UnknownError";
    const error = name === "TimeoutError" ? "timeout" : "network_error";
    console.error(`[keep-alive] falha ao contatar Supabase: ${name}`);
    return fail(error);
  }
}
