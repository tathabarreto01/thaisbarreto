import { NextResponse } from "next/server";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export const runtime = "nodejs";

export interface PhoneValidation {
  valid: boolean;
  e164?: string; // +5511999999999
  national?: string; // (11) 99999-9999
  international?: string;
  isMobile?: boolean; // provável WhatsApp
  country?: string | null;
}

export async function POST(req: Request) {
  let phone = "";
  try {
    const body = await req.json();
    phone = String(body?.phone ?? "").trim();
  } catch {
    return NextResponse.json({ valid: false } satisfies PhoneValidation);
  }

  // País padrão Brasil; aceita também números já em formato internacional (+...).
  const parsed = parsePhoneNumberFromString(phone, "BR");
  if (!parsed || !parsed.isValid()) {
    return NextResponse.json({ valid: false } satisfies PhoneValidation);
  }

  // Detecção de celular: no Brasil o getType() é impreciso, então usamos a
  // regra oficial (DDD + 9 dígitos, iniciando o assinante com 9).
  let isMobile: boolean;
  if (parsed.country === "BR") {
    const nn = parsed.nationalNumber; // ex.: "11987654321"
    isMobile = nn.length === 11 && nn[2] === "9";
  } else {
    const type = parsed.getType();
    isMobile = type === "MOBILE" || type === "FIXED_LINE_OR_MOBILE";
  }

  return NextResponse.json({
    valid: true,
    e164: parsed.number,
    national: parsed.formatNational(),
    international: parsed.formatInternational(),
    isMobile,
    country: parsed.country ?? null,
  } satisfies PhoneValidation);
}
