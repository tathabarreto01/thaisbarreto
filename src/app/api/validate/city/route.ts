import { NextResponse } from "next/server";

export const runtime = "nodejs";

export interface CityMatch {
  name: string;
  uf: string; // sigla do estado (ex.: SP)
  label: string; // "Campinas / SP"
}
export interface CityValidation {
  matches: CityMatch[];
  exact: boolean; // o texto informado é exatamente um município do Brasil
}

interface IbgeMunicipio {
  nome: string;
  microrregiao?: { mesorregiao?: { UF?: { sigla?: string } } };
  "regiao-imediata"?: { "regiao-intermediaria"?: { UF?: { sigla?: string } } };
}

// Cache em memória do módulo (persiste entre requisições no runtime Node).
let CACHE: CityMatch[] | null = null;
let CACHE_AT = 0;
const DAY = 24 * 60 * 60 * 1000;

function ufOf(m: IbgeMunicipio): string {
  return (
    m.microrregiao?.mesorregiao?.UF?.sigla ??
    m["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla ??
    ""
  );
}

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

async function getCities(): Promise<CityMatch[]> {
  if (CACHE && Date.now() - CACHE_AT < DAY) return CACHE;
  const res = await fetch(
    "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome",
    { next: { revalidate: 86400 } },
  );
  if (!res.ok) throw new Error(`IBGE ${res.status}`);
  const data = (await res.json()) as IbgeMunicipio[];
  CACHE = data.map((m) => {
    const uf = ufOf(m);
    return { name: m.nome, uf, label: uf ? `${m.nome} / ${uf}` : m.nome };
  });
  CACHE_AT = Date.now();
  return CACHE;
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const nq = norm(q);
  if (nq.length < 2) {
    return NextResponse.json({ matches: [], exact: false } satisfies CityValidation);
  }

  let cities: CityMatch[];
  try {
    cities = await getCities();
  } catch {
    // Se o IBGE estiver indisponível, não bloqueia o usuário.
    return NextResponse.json({ matches: [], exact: false } satisfies CityValidation);
  }

  const starts: CityMatch[] = [];
  const contains: CityMatch[] = [];
  let exact = false;
  for (const c of cities) {
    const n = norm(c.name);
    if (n === nq) exact = true;
    if (n.startsWith(nq)) starts.push(c);
    else if (n.includes(nq)) contains.push(c);
  }

  // Mostra TODAS as cidades que correspondem (sem limite), ordenadas por
  // relevância: primeiro as que começam com o termo, depois as que o contêm.
  const matches = [...starts, ...contains];
  return NextResponse.json({ matches, exact } satisfies CityValidation);
}
