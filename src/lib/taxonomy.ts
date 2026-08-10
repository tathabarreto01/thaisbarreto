import type {
  CategoryId,
  FunnelStatus,
  Intimacy,
} from "./types";

// Taxonomy taken faithfully from the "Mapa de Prospectos" worksheet.

export interface CategoryDef {
  id: CategoryId;
  label: string;
  icon: string; // emoji used as a lightweight glyph
  hint: string;
  subcategories: string[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: "familia",
    label: "Família",
    icon: "👨‍👩‍👧",
    hint: "As pessoas mais próximas costumam ser o melhor ponto de partida.",
    subcategories: ["Irmãos", "Primos", "Tios", "Familiares indiretos"],
  },
  {
    id: "amigos",
    label: "Amigos",
    icon: "🤝",
    hint: "Quem convive com você e confia em você.",
    subcategories: ["Próximos", "Da academia", "Empreendedores", "Da escola"],
  },
  {
    id: "redes",
    label: "Redes sociais",
    icon: "📱",
    hint: "Quem interage com você no digital.",
    subcategories: [
      "Reagem com frequência",
      "Grupos de interesse",
      "Contatos de eventos on-line",
    ],
  },
  {
    id: "comunidade",
    label: "Comunidade",
    icon: "🏘️",
    hint: "Pessoas do seu dia a dia e da sua região.",
    subcategories: ["Igreja", "Escola", "Vizinhos", "Atividades dos filhos"],
  },
  {
    id: "trabalho",
    label: "Trabalho",
    icon: "💼",
    hint: "Sua rede profissional atual e passada.",
    subcategories: ["Ex-colegas", "Colegas/equipe", "Clientes", "Contatos freelance"],
  },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, CategoryDef>;

export interface IntimacyDef {
  id: Intimacy;
  label: string;
  color: string; // hex used for dots
}

export const INTIMACY: IntimacyDef[] = [
  { id: "muito_proximo", label: "Muito próximo", color: "#22c55e" },
  { id: "conhecido", label: "Conhecido", color: "#f59e0b" },
  { id: "prospecto_digital", label: "Prospecto digital", color: "#3b82f6" },
];

export const INTIMACY_MAP: Record<Intimacy, IntimacyDef> = Object.fromEntries(
  INTIMACY.map((i) => [i.id, i]),
) as Record<Intimacy, IntimacyDef>;

export const INTEREST_LABELS = [
  "Nenhum",
  "Pouco",
  "Neutro",
  "Interessado",
  "Muito interessado",
];

export interface StatusDef {
  id: FunnelStatus;
  label: string;
  color: string;
  bg: string;
}

export const STATUSES: StatusDef[] = [
  { id: "novo", label: "Novo", color: "#1d4ed8", bg: "rgba(219,234,254,0.8)" },
  { id: "contatado", label: "Contatado", color: "#7c3aed", bg: "rgba(237,233,254,0.8)" },
  { id: "reuniao", label: "Reunião", color: "#0891b2", bg: "rgba(207,250,254,0.8)" },
  { id: "negociando", label: "Negociando", color: "#c2410c", bg: "rgba(255,237,213,0.8)" },
  { id: "fechado", label: "Fechado", color: "#15803d", bg: "rgba(220,252,231,0.8)" },
  { id: "perdido", label: "Perdido", color: "#b91c1c", bg: "rgba(254,226,226,0.8)" },
];

export const STATUS_MAP: Record<FunnelStatus, StatusDef> = Object.fromEntries(
  STATUSES.map((s) => [s.id, s]),
) as Record<FunnelStatus, StatusDef>;

export const CHANNELS: Record<string, { label: string; icon: string }> = {
  ligacao: { label: "Ligação", icon: "📞" },
  whatsapp: { label: "WhatsApp", icon: "💬" },
  email: { label: "E-mail", icon: "✉️" },
  presencial: { label: "Presencial", icon: "🤝" },
  outro: { label: "Outro", icon: "•" },
};
