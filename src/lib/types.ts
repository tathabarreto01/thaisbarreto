// Domain model for the "Mapa de Prospectos" CRM.
// Kept framework-agnostic so it can back either localStorage or a cloud DB.

export type CategoryId =
  | 'familia'
  | 'amigos'
  | 'redes'
  | 'comunidade'
  | 'trabalho';

export type Intimacy = 'muito_proximo' | 'conhecido' | 'prospecto_digital';

export type FunnelStatus =
  | 'novo'
  | 'contatado'
  | 'reuniao'
  | 'acompanhamento'
  | 'fechado'
  | 'perdido';

export interface ContactLogEntry {
  id: string;
  date: string; // ISO
  channel: 'ligacao' | 'whatsapp' | 'email' | 'presencial' | 'outro';
  note: string;
}

export interface Prospect {
  id: string;
  name: string;
  category: CategoryId;
  subcategory: string; // e.g. "Irmãos", "Da academia"...
  intimacy: Intimacy;
  interest: number; // 0..5 stars
  status: FunnelStatus;

  // Expanded CRM fields
  phone?: string;
  email?: string;
  city?: string;
  motivations: string[]; // "Fatores de Motivação" (múltipla escolha)
  interestNotes?: string; // texto livre quando "Outro" é marcado em motivations
  nextStep?: string; // "Próximo passo"
  nextStepDate?: string; // ISO date
  favorite: boolean; // "Meus 5 principais"

  history: ContactLogEntry[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface WeeklyChallenge {
  week: number;
  goalCount: number; // target of prospects to register
  contactGoal: number; // target of contacts to make
  startedAt: string; // ISO
}

export interface AppData {
  version: 1;
  prospects: Prospect[];
  challenge: WeeklyChallenge;
}

export type ProspectDraft = Omit<
  Prospect,
  'id' | 'createdAt' | 'updatedAt' | 'history' | 'favorite' | 'status' | 'motivations'
> &
  Partial<Pick<Prospect, 'favorite' | 'status' | 'history' | 'motivations'>>;
