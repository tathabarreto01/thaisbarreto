import type { Prospect } from "./types";
import { CATEGORY_MAP, INTIMACY_MAP, STATUS_MAP } from "./taxonomy";

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function prospectsToCSV(prospects: Prospect[]): string {
  const headers = [
    "Nome",
    "Categoria",
    "Subcategoria",
    "Nível de intimidade",
    "Interesse (0-5)",
    "Status",
    "Telefone/WhatsApp",
    "E-mail",
    "Cidade",
    "Pode se interessar por",
    "Próximo passo",
    "Data do próximo passo",
    "Favorito",
    "Nº de contatos",
    "Criado em",
  ];

  const rows = prospects.map((p) => [
    p.name,
    CATEGORY_MAP[p.category]?.label ?? p.category,
    p.subcategory,
    INTIMACY_MAP[p.intimacy]?.label ?? p.intimacy,
    p.interest,
    STATUS_MAP[p.status]?.label ?? p.status,
    p.phone ?? "",
    p.email ?? "",
    p.city ?? "",
    p.interestNotes ?? "",
    p.nextStep ?? "",
    p.nextStepDate ? new Date(p.nextStepDate).toLocaleDateString("pt-BR") : "",
    p.favorite ? "Sim" : "Não",
    (p.history ?? []).length,
    new Date(p.createdAt).toLocaleDateString("pt-BR"),
  ]);

  return [headers, ...rows]
    .map((r) => r.map(csvCell).join(","))
    .join("\r\n");
}

export function downloadCSV(prospects: Prospect[], filename = "mapa-de-prospectos.csv") {
  const csv = "﻿" + prospectsToCSV(prospects); // BOM for Excel/pt-BR
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}

export function downloadJSON(data: unknown, filename = "mapa-de-prospectos-backup.json") {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
