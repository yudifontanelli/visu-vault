import type { ISODate } from '../../lib/dates.ts';
import type { CheckItem } from '../editorial/model.ts';

/** Projects: productions in progress. Finished ones go to the Archive. */

export const STAGES = ['briefing', 'pre', 'producao', 'pos', 'entrega'] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  briefing: 'Briefing',
  pre: 'Pré-produção',
  producao: 'Produção',
  pos: 'Pós-produção',
  entrega: 'Entrega',
};

export const PROJECT_KINDS = ['Campanha', 'Exposição', 'Filme', 'Edição especial', 'Identidade'] as const;
export type ProjectKind = (typeof PROJECT_KINDS)[number];

export interface Project {
  id: string;
  code: string;
  title: string;
  kind: ProjectKind;
  partner: string;
  leadId: string;
  start: ISODate;
  due: ISODate;
  stage: Stage;
  summary: string;
  deliverables: CheckItem[];
  archived: boolean;
}

export type ProjectAction =
  | { type: 'projects/create'; project: Project }
  | { type: 'projects/setStage'; id: string; stage: Stage }
  | { type: 'projects/toggleDeliverable'; id: string; itemId: string }
  | { type: 'projects/addDeliverable'; id: string; item: CheckItem }
  | { type: 'projects/remove'; id: string };

export function progress(p: Pick<Project, 'deliverables'>): { done: number; total: number; ratio: number } {
  const total = p.deliverables.length;
  const done = p.deliverables.filter((d) => d.done).length;
  return { done, total, ratio: total === 0 ? 0 : done / total };
}

export type ArchiveCheck = { ok: true } | { ok: false; reason: string };

export function canArchive(p: Project): ArchiveCheck {
  if (p.archived) return { ok: false, reason: 'Projeto já arquivado.' };
  if (p.stage !== 'entrega') return { ok: false, reason: 'Leve o projeto até a etapa Entrega.' };
  const { done, total } = progress(p);
  if (done < total) return { ok: false, reason: `Faltam ${total - done} de ${total} entregas.` };
  return { ok: true };
}

export function nextProjectCode(projects: readonly Project[]): string {
  const max = projects.reduce((m, p) => Math.max(m, Number(p.code.replace(/\D/g, '')) || 0), 0);
  return `PR-${String(max + 1).padStart(2, '0')}`;
}

function patch(projects: Project[], id: string, fn: (p: Project) => Project): Project[] {
  return projects.map((p) => (p.id === id ? fn(p) : p));
}

export function projectsReducer(projects: Project[], action: ProjectAction): Project[] {
  switch (action.type) {
    case 'projects/create':
      return [...projects, action.project];
    case 'projects/setStage':
      return patch(projects, action.id, (p) => (p.stage === action.stage ? p : { ...p, stage: action.stage }));
    case 'projects/toggleDeliverable':
      return patch(projects, action.id, (p) => ({
        ...p,
        deliverables: p.deliverables.map((d) => (d.id === action.itemId ? { ...d, done: !d.done } : d)),
      }));
    case 'projects/addDeliverable':
      return patch(projects, action.id, (p) => ({ ...p, deliverables: [...p.deliverables, action.item] }));
    case 'projects/remove':
      return projects.filter((p) => p.id !== action.id);
  }
}
