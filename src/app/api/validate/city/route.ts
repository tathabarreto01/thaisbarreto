import { NextResponse } from "next/server";
// Lista oficial de municípios do IBGE ([nome, UF]), versionada no projeto.
// A API do IBGE envia uma cadeia de certificado TLS incompleta, que o fetch do
// Node rejeita (UNABLE_TO_VERIFY_LEAF_SIGNATURE) — buscar ao vivo deixava o
// autocomplete sempre vazio. Para atualizar, regere este arquivo a partir de
// https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome
import MUNICIPIOS from "@/lib/municipios.json";

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

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Pré-processado uma vez por instância: nome normalizado evita refazer o
// normalize() de 5.570 nomes a cada tecla digitada.
const CITIES = (MUNICIPIOS as [string, string][]).map(([name, uf]) => ({
  city: { name, uf, label: `${name} / ${uf}` } satisfies CityMatch,
  n: norm(name),
}));
const UFS = new Set(CITIES.map((c) => c.city.uf));

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("q") ?? "";
  // Aceita o nome seguido da UF: "São Paulo / SP", "São Paulo - SP",
  // ou "São Paulo, SP". O hífen só conta como separador com espaço ao lado e a
  // sigla precisa ser uma UF válida, para não cortar nomes como "Embu-Guaçu".
  const parts = raw.match(/^(.*?)(?:\s*[/,]\s*|\s+-\s*|\s*-\s+)([A-Za-z]{2})\s*$/);
  const hasUf = !!parts && UFS.has(parts[2].toUpperCase());
  const namePart = hasUf ? parts![1] : raw;
  const ufPart = hasUf ? parts![2].toUpperCase() : null;
  const nq = norm(namePart);
  if (nq.length < 2) {
    return NextResponse.json({ matches: [], exact: false } satisfies CityValidation);
  }

  const starts: CityMatch[] = [];
  const contains: CityMatch[] = [];
  let exact = false;
  for (const { city, n } of CITIES) {
    if (ufPart && city.uf !== ufPart) continue;
    if (n === nq) exact = true;
    if (n.startsWith(nq)) starts.push(city);
    else if (n.includes(nq)) contains.push(city);
  }

  // Mostra TODAS as cidades que correspondem (sem limite), ordenadas por
  // relevância: primeiro as que começam com o termo, depois as que o contêm.
  const matches = [...starts, ...contains];
  return NextResponse.json({ matches, exact } satisfies CityValidation);
}
