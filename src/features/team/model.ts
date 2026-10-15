/** The studio's masthead (expediente). Fictional people for the demo session. */

export type Availability = 'disponivel' | 'producao' | 'ausente';

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  disponivel: 'Disponível',
  producao: 'Em produção',
  ausente: 'Ausente',
};

export const AVAILABILITY_ORDER: readonly Availability[] = ['disponivel', 'producao', 'ausente'];

export interface Member {
  id: string;
  name: string;
  initials: string;
  role: string;
  /** Editorial department, as printed in the masthead. */
  desk: string;
  focus: string;
}

export const MEMBERS: readonly Member[] = [
  { id: 'hd', name: 'Helena Duarte', initials: 'HD', role: 'Direção editorial', desk: 'Editorial', focus: 'Ensaio, linha editorial e fechamento.' },
  { id: 'cm', name: 'Caio Menezes', initials: 'CM', role: 'Direção de arte', desk: 'Arte', focus: 'Identidade, capas e direção de imagem.' },
  { id: 'lo', name: 'Lia Okada', initials: 'LO', role: 'Fotografia', desk: 'Imagem', focus: 'Retrato, arquivo fotográfico e tratamento.' },
  { id: 'rv', name: 'Rafael Ventura', initials: 'RV', role: 'Moda e styling', desk: 'Moda', focus: 'Produção de moda, alfaiataria e acervo têxtil.' },
  { id: 'bl', name: 'Beatriz Lemos', initials: 'BL', role: 'Cinema e crítica', desk: 'Cinema', focus: 'Crítica, programação e ensaios audiovisuais.' },
  { id: 'ta', name: 'Tomás Arantes', initials: 'TA', role: 'Design gráfico', desk: 'Arte', focus: 'Diagramação, tipografia e espelho.' },
  { id: 'nv', name: 'Nina Valadares', initials: 'NV', role: 'Revisão e arquivo', desk: 'Editorial', focus: 'Revisão de provas, checagem e catalogação.' },
];

export function memberById(id: string | undefined): Member | undefined {
  return MEMBERS.find((m) => m.id === id);
}

export type TeamState = Record<string, Availability>;

export type TeamAction = { type: 'team/setAvailability'; memberId: string; availability: Availability };

export function teamReducer(state: TeamState, action: TeamAction): TeamState {
  switch (action.type) {
    case 'team/setAvailability':
      if (state[action.memberId] === action.availability) return state;
      return { ...state, [action.memberId]: action.availability };
  }
}

export function nextAvailability(a: Availability): Availability {
  const i = AVAILABILITY_ORDER.indexOf(a);
  return AVAILABILITY_ORDER[(i + 1) % AVAILABILITY_ORDER.length];
}

export const TEAM_SEED: TeamState = {
  hd: 'producao',
  cm: 'producao',
  lo: 'disponivel',
  rv: 'producao',
  bl: 'disponivel',
  ta: 'producao',
  nv: 'ausente',
};
