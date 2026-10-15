export type EnvironmentId = 'brainstorm' | 'editorial' | 'projects' | 'library' | 'archive' | 'team';

export interface Environment {
  id: EnvironmentId;
  name: string;
  /** Short line shown on the Home card. */
  summary: string;
  /** What the environment will hold, shown on its own screen. */
  description: string;
  /** Planned building blocks, displayed as the empty-state roadmap. */
  modules: string[];
}

export const ENVIRONMENTS: readonly Environment[] = [
  {
    id: 'brainstorm',
    name: 'Brainstorm',
    summary: 'Ideias soltas, referências e esboços.',
    description: 'Espaço livre para capturar ideias, moodboards e primeiras direções criativas.',
    modules: ['Quadro de ideias', 'Moodboards', 'Notas rápidas'],
  },
  {
    id: 'editorial',
    name: 'Editorial',
    summary: 'Pautas, textos e calendário.',
    description: 'Planejamento editorial, rascunhos de texto e fluxo de revisão de conteúdo.',
    modules: ['Pautas', 'Rascunhos', 'Calendário editorial'],
  },
  {
    id: 'projects',
    name: 'Projects',
    summary: 'Projetos ativos e entregas.',
    description: 'Acompanhamento de projetos, etapas, prazos e entregas da Visuvault.',
    modules: ['Quadro de projetos', 'Etapas e prazos', 'Entregas'],
  },
  {
    id: 'library',
    name: 'Library',
    summary: 'Ativos, marcas e materiais.',
    description: 'Biblioteca de ativos visuais, guias de marca, fontes e materiais de apoio.',
    modules: ['Ativos visuais', 'Guias de marca', 'Tipografia'],
  },
  {
    id: 'archive',
    name: 'Archive',
    summary: 'Histórico e trabalhos concluídos.',
    description: 'Arquivo de projetos finalizados, versões anteriores e registros.',
    modules: ['Projetos concluídos', 'Versões', 'Registros'],
  },
  {
    id: 'team',
    name: 'Team',
    summary: 'Pessoas, papéis e colaboração.',
    description: 'Equipe, papéis e permissões, e a colaboração dentro do workspace.',
    modules: ['Membros', 'Papéis e acessos', 'Atividade'],
  },
];
