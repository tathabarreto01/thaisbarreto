import { NextResponse } from "next/server";
import dns from "node:dns/promises";

export const runtime = "nodejs";

// Formato de e-mail (pragmático — não RFC completo, mas cobre o mundo real).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface EmailValidation {
  valid: boolean; // formato válido
  deliverable: boolean; // domínio aceita e-mail (tem registro MX)
  reason?: "formato" | "sem_mx" | "dominio_inexistente";
  domain?: string;
}

export async function POST(req: Request) {
  let email = "";
  try {
    const body = await req.json();
    email = String(body?.email ?? "").trim();
  } catch {
    return NextResponse.json({ valid: false, deliverable: false, reason: "formato" } satisfies EmailValidation);
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ valid: false, deliverable: false, reason: "formato" } satisfies EmailValidation);
  }

  const domain = email.split("@")[1].toLowerCase();
  try {
    const mx = await dns.resolveMx(domain);
    const deliverable = Array.isArray(mx) && mx.length > 0;
    return NextResponse.json({
      valid: true,
      deliverable,
      domain,
      reason: deliverable ? undefined : "sem_mx",
    } satisfies EmailValidation);
  } catch {
    // Domínio não resolve MX (pode não existir ou não receber e-mail).
    return NextResponse.json({
      valid: true,
      deliverable: false,
      domain,
      reason: "dominio_inexistente",
    } satisfies EmailValidation);
  }
}
