import type { ISODate } from '../lib/dates.ts';
import type { ArchiveRecord } from '../features/archive/model.ts';
import { recordFromProject } from '../features/archive/model.ts';
import type { BoardAction, BoardItem } from '../features/board/model.ts';
import { boardReducer } from '../features/board/model.ts';
import type { DeskAction, Story } from '../features/editorial/model.ts';
import { deskReducer } from '../features/editorial/model.ts';
import type { Project, ProjectAction } from '../features/projects/model.ts';
import { canArchive, projectsReducer } from '../features/projects/model.ts';
import type { Dossier, StudyAction } from '../features/study/model.ts';
import { studyReducer } from '../features/study/model.ts';
import type { TeamAction, TeamState } from '../features/team/model.ts';
import { TEAM_SEED, teamReducer } from '../features/team/model.ts';
import { seedArchive, seedBoard, seedDesk, seedProjects, seedStudy } from './seed.ts';

export const STATE_VERSION = 1;

export interface AppState {
  board: BoardItem[];
  desk: Story[];
  projects: Project[];
  archive: ArchiveRecord[];
  study: Dossier[];
  team: TeamState;
}

export type AppAction =
  | BoardAction
  | DeskAction
  | ProjectAction
  | StudyAction
  | TeamAction
  | { type: 'app/hydrate'; state: AppState }
  | { type: 'app/reset'; state: AppState }
  /** Files a finished project in the Archive (cross-module). */
  | { type: 'projects/archive'; id: string; recordId: string; on: ISODate }
  /** Takes a record out of the Archive and reopens its project. */
  | { type: 'archive/restore'; recordId: string };

export function seedState(today: ISODate): AppState {
  return {
    board: seedBoard(),
    desk: seedDesk(today),
    projects: seedProjects(today),
    archive: seedArchive(),
    study: seedStudy(today),
    team: { ...TEAM_SEED },
  };
}

export function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false;
  const s = value as Record<string, unknown>;
  return (
    Array.isArray(s.board) &&
    Array.isArray(s.desk) &&
    Array.isArray(s.projects) &&
    Array.isArray(s.archive) &&
    Array.isArray(s.study) &&
    !!s.team &&
    typeof s.team === 'object'
  );
}

function slice<K extends keyof AppState>(state: AppState, key: K, next: AppState[K]): AppState {
  return next === state[key] ? state : { ...state, [key]: next };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  if (action.type === 'app/hydrate' || action.type === 'app/reset') return action.state;

  if (action.type === 'projects/archive') {
    const project = state.projects.find((p) => p.id === action.id);
    if (!project || !canArchive(project).ok) return state;
    const record = recordFromProject(project, state.archive, action.recordId, action.on);
    return {
      ...state,
      projects: state.projects.map((p) => (p.id === action.id ? { ...p, archived: true } : p)),
      archive: [record, ...state.archive],
    };
  }

  if (action.type === 'archive/restore') {
    const record = state.archive.find((r) => r.id === action.recordId);
    if (!record?.projectId) return state;
    return {
      ...state,
      archive: state.archive.filter((r) => r.id !== action.recordId),
      projects: state.projects.map((p) => (p.id === record.projectId ? { ...p, archived: false } : p)),
    };
  }

  const prefix = action.type.slice(0, action.type.indexOf('/'));
  switch (prefix) {
    case 'board':
      return slice(state, 'board', boardReducer(state.board, action as BoardAction));
    case 'desk':
      return slice(state, 'desk', deskReducer(state.desk, action as DeskAction));
    case 'projects':
      return slice(state, 'projects', projectsReducer(state.projects, action as ProjectAction));
    case 'study':
      return slice(state, 'study', studyReducer(state.study, action as StudyAction));
    case 'team':
      return slice(state, 'team', teamReducer(state.team, action as TeamAction));
    default:
      return state;
  }
}
