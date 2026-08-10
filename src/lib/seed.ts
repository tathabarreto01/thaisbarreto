import type { ProspectDraft } from "./types";

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

// Realistic demo data spanning every category, intimacy and funnel stage.
export const SAMPLE_PROSPECTS: ProspectDraft[] = [
  {
    name: "Maria Souza", category: "familia", subcategory: "Irmãos",
    intimacy: "muito_proximo", interest: 4, status: "contatado",
    phone: "(11) 98888-1234", city: "São Paulo / SP", favorite: true,
    interestNotes: "Renda extra para ajudar em casa", nextStep: "Apresentar o plano num café", nextStepDate: daysFromNow(2),
  },
  {
    name: "João Pedro", category: "familia", subcategory: "Primos",
    intimacy: "muito_proximo", interest: 3, status: "novo",
    city: "Campinas / SP", interestNotes: "Produtos de bem-estar",
  },
  {
    name: "Ana Clara", category: "amigos", subcategory: "Da academia",
    intimacy: "conhecido", interest: 5, status: "reuniao",
    phone: "(11) 97777-4567", favorite: true,
    interestNotes: "Já é fitness — nutrição e suplementos", nextStep: "Enviar catálogo de nutrição", nextStepDate: daysFromNow(1),
  },
  {
    name: "Rafael Lima", category: "amigos", subcategory: "Empreendedores",
    intimacy: "conhecido", interest: 5, status: "negociando",
    phone: "(21) 96666-7890", city: "Rio de Janeiro / RJ", favorite: true,
    interestNotes: "Busca um segundo negócio escalável", nextStep: "Fechar cadastro como consultor", nextStepDate: daysFromNow(3),
  },
  {
    name: "Beatriz Alves", category: "amigos", subcategory: "Da escola",
    intimacy: "conhecido", interest: 2, status: "novo",
    interestNotes: "Talvez indique outras pessoas",
  },
  {
    name: "Carla Mendes", category: "redes", subcategory: "Reagem com frequência",
    intimacy: "prospecto_digital", interest: 4, status: "contatado",
    interestNotes: "Comenta muito nos posts de bem-estar", nextStep: "Chamar no direct", nextStepDate: daysFromNow(0), favorite: true,
  },
  {
    name: "Diego Fernandes", category: "redes", subcategory: "Grupos de interesse",
    intimacy: "prospecto_digital", interest: 3, status: "novo",
    interestNotes: "Grupo de renda extra",
  },
  {
    name: "Patrícia Gomes", category: "comunidade", subcategory: "Igreja",
    intimacy: "conhecido", interest: 4, status: "reuniao",
    city: "Guarulhos / SP", nextStep: "Levar amostra no próximo encontro", nextStepDate: daysFromNow(5), favorite: true,
  },
  {
    name: "Sr. Antônio", category: "comunidade", subcategory: "Vizinhos",
    intimacy: "conhecido", interest: 2, status: "novo",
  },
  {
    name: "Fernanda Rocha", category: "comunidade", subcategory: "Atividades dos filhos",
    intimacy: "conhecido", interest: 3, status: "contatado",
    interestNotes: "Mãe da escolinha — busca flexibilidade de horário",
  },
  {
    name: "Lucas Martins", category: "trabalho", subcategory: "Ex-colegas",
    intimacy: "conhecido", interest: 5, status: "fechado",
    phone: "(31) 95555-3210", city: "Belo Horizonte / MG",
    interestNotes: "Já comprou e quer revender", nextStep: "Onboarding da equipe",
  },
  {
    name: "Juliana Prado", category: "trabalho", subcategory: "Clientes",
    intimacy: "conhecido", interest: 4, status: "negociando",
    interestNotes: "Cliente fiel, confia nas indicações", nextStep: "Proposta de kit inicial", nextStepDate: daysFromNow(4),
  },
  {
    name: "Marcos Vinícius", category: "trabalho", subcategory: "Contatos freelance",
    intimacy: "prospecto_digital", interest: 1, status: "perdido",
    interestNotes: "Sem interesse no momento",
  },
];
