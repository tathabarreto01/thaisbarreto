import type { CategoryId, FunnelStatus, Intimacy } from './types';

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
    id: 'familia',
    label: 'Família',
    icon: '👨‍👩‍👧',
    hint: 'As pessoas mais próximas costumam ser o melhor ponto de partida.',
    subcategories: ['Irmãos', 'Primos', 'Tios', 'Familiares indiretos'],
  },
  {
    id: 'amigos',
    label: 'Amigos',
    icon: '🤝',
    hint: 'Quem convive com você e confia em você.',
    subcategories: ['Próximos', 'Da academia', 'Empreendedores', 'Da escola'],
  },
  {
    id: 'redes',
    label: 'Redes sociais',
    icon: '📱',
    hint: 'Quem interage com você no digital.',
    subcategories: [
      'Reagem com frequência',
      'Grupos de interesse',
      'Contatos de eventos on-line',
    ],
  },
  {
    id: 'comunidade',
    label: 'Comunidade',
    icon: '🏘️',
    hint: 'Pessoas do seu dia a dia e da sua região.',
    subcategories: ['Igreja', 'Escola', 'Vizinhos', 'Atividades dos filhos'],
  },
  {
    id: 'trabalho',
    label: 'Trabalho',
    icon: '💼',
    hint: 'Sua rede profissional atual e passada.',
    subcategories: [
      'Ex-colegas',
      'Colegas/equipe',
      'Clientes',
      'Contatos freelance',
    ],
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
  { id: 'muito_proximo', label: 'Contato Frio', color: '#22c55e' },
  { id: 'conhecido', label: 'Contato Morno', color: '#f59e0b' },
  { id: 'prospecto_digital', label: 'Contato Quente', color: '#3b82f6' },
];

export const INTIMACY_MAP: Record<Intimacy, IntimacyDef> = Object.fromEntries(
  INTIMACY.map((i) => [i.id, i]),
) as Record<Intimacy, IntimacyDef>;

// "Fatores de Motivação" — múltipla escolha (ordem fixa; "Outro" por último).
export const MOTIVATIONS: string[] = [
  'Complementar a renda',
  'Usufruir de autonomia financeira',
  'Ter o próprio negócio',
  'Dispor de mais tempo livre',
  'Buscar o desenvolvimento pessoal',
  'Ajudar os outros',
  'Conhecer pessoas',
  'Ter uma aposentadoria digna',
  'Deixar um legado',
  'Outro',
];

export const MOTIVATION_OTHER = 'Outro';

// "Próximo passo" — ações padrão sugeridas (dropdown).
export const NEXT_STEPS: string[] = [
  'Agendar reunião online/presencial',
  'Mostrar produto',
  'Enviar materiais',
  'Pegar a lista',
  'Promover eventos',
  'Integração',
];

export const INTEREST_LABELS = [
  'Nenhum',
  'Pouco',
  'Neutro',
  'Interessado',
  'Muito interessado',
];

export interface StatusDef {
  id: FunnelStatus;
  label: string;
  color: string;
  bg: string;
}

export const STATUSES: StatusDef[] = [
  { id: 'novo', label: 'Novo', color: '#1d4ed8', bg: 'rgba(219,234,254,0.8)' },
  {
    id: 'contatado',
    label: 'Contatado',
    color: '#7c3aed',
    bg: 'rgba(237,233,254,0.8)',
  },
  {
    id: 'reuniao',
    label: 'Reunião',
    color: '#0891b2',
    bg: 'rgba(207,250,254,0.8)',
  },
  {
    id: 'acompanhamento',
    label: 'Acompanhamento',
    color: '#c2410c',
    bg: 'rgba(255,237,213,0.8)',
  },
  {
    id: 'fechado',
    label: 'Fechado',
    color: '#15803d',
    bg: 'rgba(220,252,231,0.8)',
  },
  {
    id: 'perdido',
    label: 'Perdido',
    color: '#b91c1c',
    bg: 'rgba(254,226,226,0.8)',
  },
];

export const STATUS_MAP: Record<FunnelStatus, StatusDef> = Object.fromEntries(
  STATUSES.map((s) => [s.id, s]),
) as Record<FunnelStatus, StatusDef>;

/* ------------------------------------------------------------------ *
 * Safe lookups — never throw on legacy/unknown values.
 * Records may carry values that were removed from the enums (e.g. an
 * old 'negociando' status). These getters degrade gracefully to a
 * neutral definition that shows the raw value instead of crashing.
 * ------------------------------------------------------------------ */

export function getStatusDef(status: string | null | undefined): StatusDef {
  return (
    STATUS_MAP[status as FunnelStatus] ?? {
      id: status as FunnelStatus,
      label: status || '—',
      color: '#64748b',
      bg: 'rgba(226,232,240,0.85)',
    }
  );
}

export function getCategoryDef(category: string | null | undefined): CategoryDef {
  return (
    CATEGORY_MAP[category as CategoryId] ?? {
      id: category as CategoryId,
      label: category || '—',
      icon: '❓',
      hint: '',
      subcategories: [],
    }
  );
}

export function getIntimacyDef(intimacy: string | null | undefined): IntimacyDef {
  return (
    INTIMACY_MAP[intimacy as Intimacy] ?? {
      id: intimacy as Intimacy,
      label: intimacy || '—',
      color: '#64748b',
    }
  );
}

export const CHANNELS: Record<string, { label: string; icon: string }> = {
  ligacao: { label: 'Ligação', icon: '📞' },
  whatsapp: { label: 'WhatsApp', icon: '💬' },
  email: { label: 'E-mail', icon: '✉️' },
  presencial: { label: 'Presencial', icon: '🤝' },
  outro: { label: 'Outro', icon: '•' },
};
