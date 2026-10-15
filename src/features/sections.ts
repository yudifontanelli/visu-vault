/** The workspace's table of contents. Numbers are section folios, as in a magazine. */

export type SectionId = 'home' | 'brainstorm' | 'editorial' | 'projects' | 'library' | 'archive' | 'study' | 'team';

export interface SectionDef {
  id: SectionId;
  number: string;
  name: string;
  /** Running head shown under the name. */
  kicker: string;
  dek: string;
}

export const SECTIONS: readonly SectionDef[] = [
  { id: 'home', number: '00', name: 'Capa', kicker: 'Sumário da edição', dek: 'O estado do estúdio numa página.' },
  { id: 'brainstorm', number: '01', name: 'Brainstorm', kicker: 'Mesa de direção criativa', dek: 'Imagens, notas e referências, livres sobre a mesa.' },
  { id: 'editorial', number: '02', name: 'Editorial Desk', kicker: 'Pautas, provas e espelho', dek: 'Do pitch ao fechamento, com a edição à vista.' },
  { id: 'projects', number: '03', name: 'Projects', kicker: 'Produções em curso', dek: 'Etapas, entregas e prazos de cada produção.' },
  { id: 'library', number: '04', name: 'Library', kicker: 'Acervo visual curado', dek: 'Pranchas, categorias e visualização ampliada.' },
  { id: 'archive', number: '05', name: 'Archive', kicker: 'Arquivo histórico', dek: 'Gavetas por ano e fichas catalográficas.' },
  { id: 'study', number: '06', name: 'Study Room', kicker: 'Sala de estudos', dek: 'Dossiês, leituras e notas de margem.' },
  { id: 'team', number: '07', name: 'Team', kicker: 'Expediente', dek: 'Quem faz o quê, e no que está agora.' },
];

export function sectionById(id: SectionId): SectionDef {
  return SECTIONS.find((s) => s.id === id) ?? SECTIONS[0];
}

/** Optional focus when opening a section from elsewhere (e.g. a story from the cover). */
export interface NavParams {
  storyId?: string;
  plateId?: string;
  projectId?: string;
  recordId?: string;
  dossierId?: string;
  memberId?: string;
}
