import type { ISODate } from '../../lib/dates.ts';
import { daysBetween } from '../../lib/dates.ts';

/** Editorial Desk: stories move through a print workflow and onto the issue's flatplan. */

export const STATUSES = ['pauta', 'apuracao', 'redacao', 'revisao', 'fechamento', 'publicado'] as const;
export type StoryStatus = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<StoryStatus, string> = {
  pauta: 'Pauta',
  apuracao: 'Apuração',
  redacao: 'Redação',
  revisao: 'Revisão',
  fechamento: 'Fechamento',
  publicado: 'Publicado',
};

export const SECTIONS = ['Arte', 'Moda', 'Cinema', 'Fotografia', 'Design', 'Ensaio'] as const;
export type Section = (typeof SECTIONS)[number];

export interface CheckItem {
  id: string;
  label: string;
  done: boolean;
}

export interface ReviewNote {
  id: string;
  authorId: string;
  text: string;
  at: ISODate;
  resolved: boolean;
}

export interface Story {
  id: string;
  /** Running pauta number, e.g. "P-07". */
  code: string;
  title: string;
  dek: string;
  section: Section;
  authorId: string;
  editorId: string;
  deadline: ISODate;
  status: StoryStatus;
  body: string;
  wordsTarget: number;
  /** First page in the issue, or null when not yet placed. */
  pageStart: number | null;
  pageCount: number;
  checklist: CheckItem[];
  notes: ReviewNote[];
}

/** The issue being produced: cover is page 1, back cover the last page. */
export const ISSUE_PAGES = 32;

export type DeskAction =
  | { type: 'desk/create'; story: Story }
  | { type: 'desk/update'; id: string; patch: Partial<Pick<Story, 'title' | 'dek' | 'body' | 'section' | 'authorId' | 'editorId' | 'deadline' | 'wordsTarget'>> }
  | { type: 'desk/advance'; id: string }
  | { type: 'desk/retreat'; id: string }
  | { type: 'desk/toggleCheck'; id: string; itemId: string }
  | { type: 'desk/addCheck'; id: string; item: CheckItem }
  | { type: 'desk/addNote'; id: string; note: ReviewNote }
  | { type: 'desk/resolveNote'; id: string; noteId: string }
  | { type: 'desk/setPages'; id: string; pageStart: number | null; pageCount: number }
  | { type: 'desk/remove'; id: string };

export function wordCount(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

export type AdvanceCheck = { ok: true } | { ok: false; reason: string };

/** Workflow rules, enforced in the reducer and explained in the interface. */
export function canAdvance(story: Story): AdvanceCheck {
  const i = STATUSES.indexOf(story.status);
  if (i === STATUSES.length - 1) return { ok: false, reason: 'A matéria já foi publicada.' };
  const next = STATUSES[i + 1];
  if (next === 'revisao' && wordCount(story.body) === 0) {
    return { ok: false, reason: 'Envie um texto antes de pedir revisão.' };
  }
  if (next === 'fechamento') {
    const open = story.checklist.filter((c) => !c.done).length;
    if (open > 0) return { ok: false, reason: `Conclua o checklist (${open} ${open === 1 ? 'item pendente' : 'itens pendentes'}).` };
    const notes = story.notes.filter((n) => !n.resolved).length;
    if (notes > 0) return { ok: false, reason: `Resolva as notas de revisão (${notes} em aberto).` };
  }
  if (next === 'publicado' && story.pageStart === null) {
    return { ok: false, reason: 'Defina as páginas no espelho antes de publicar.' };
  }
  return { ok: true };
}

export function canRetreat(story: Story): boolean {
  return STATUSES.indexOf(story.status) > 0;
}

export type DeadlineState = 'done' | 'overdue' | 'today' | 'soon' | 'ok';

export function deadlineState(story: Pick<Story, 'deadline' | 'status'>, today: ISODate): { state: DeadlineState; days: number } {
  const days = daysBetween(today, story.deadline);
  if (story.status === 'publicado') return { state: 'done', days };
  if (days < 0) return { state: 'overdue', days };
  if (days === 0) return { state: 'today', days };
  if (days <= 3) return { state: 'soon', days };
  return { state: 'ok', days };
}

export function deadlineLabel(story: Pick<Story, 'deadline' | 'status'>, today: ISODate): string {
  const { state, days } = deadlineState(story, today);
  switch (state) {
    case 'done':
      return 'Publicada';
    case 'overdue':
      return `Atrasada ${-days} ${days === -1 ? 'dia' : 'dias'}`;
    case 'today':
      return 'Fecha hoje';
    default:
      return `Prazo em ${days} ${days === 1 ? 'dia' : 'dias'}`;
  }
}

/** Valid page range for stories: between the covers. */
export function clampPages(pageStart: number | null, pageCount: number): { pageStart: number | null; pageCount: number } {
  const count = Math.min(Math.max(1, Math.round(pageCount)), ISSUE_PAGES - 2);
  if (pageStart === null) return { pageStart: null, pageCount: count };
  const start = Math.min(Math.max(2, Math.round(pageStart)), ISSUE_PAGES - count);
  return { pageStart: start, pageCount: count };
}

export interface FlatplanPage {
  page: number;
  storyIds: string[];
  reserved?: 'capa' | 'contracapa';
}

/** Lays stories onto the issue's pages and reports pages claimed twice. */
export function flatplan(stories: readonly Story[], totalPages: number = ISSUE_PAGES) {
  const pages: FlatplanPage[] = Array.from({ length: totalPages }, (_, i) => ({ page: i + 1, storyIds: [] }));
  pages[0].reserved = 'capa';
  pages[totalPages - 1].reserved = 'contracapa';
  for (const s of stories) {
    if (s.pageStart === null) continue;
    for (let p = s.pageStart; p < s.pageStart + s.pageCount && p <= totalPages; p++) {
      pages[p - 1].storyIds.push(s.id);
    }
  }
  const conflicts = pages.filter((p) => p.storyIds.length > 1 || (p.reserved && p.storyIds.length > 0)).map((p) => p.page);
  // Spreads: cover alone, then facing pages (2–3, 4–5 …), back cover alone.
  const spreads: number[][] = [[1]];
  for (let p = 2; p < totalPages; p += 2) spreads.push(p + 1 < totalPages ? [p, p + 1] : [p]);
  spreads.push([totalPages]);
  const free = pages.filter((p) => !p.reserved && p.storyIds.length === 0).length;
  return { pages, conflicts, spreads, free };
}

/** First run of `count` free pages, for placing a story quickly. */
export function firstFreeRun(stories: readonly Story[], count: number, ignoreId?: string): number | null {
  const { pages } = flatplan(stories.filter((s) => s.id !== ignoreId));
  for (let start = 2; start + count - 1 <= ISSUE_PAGES - 1; start++) {
    let ok = true;
    for (let p = start; p < start + count; p++) {
      if (pages[p - 1].storyIds.length > 0) {
        ok = false;
        break;
      }
    }
    if (ok) return start;
  }
  return null;
}

export function nextStoryCode(stories: readonly Story[]): string {
  const max = stories.reduce((m, s) => Math.max(m, Number(s.code.replace(/\D/g, '')) || 0), 0);
  return `P-${String(max + 1).padStart(2, '0')}`;
}

function patchStory(stories: Story[], id: string, fn: (s: Story) => Story): Story[] {
  let changed = false;
  const next = stories.map((s) => {
    if (s.id !== id) return s;
    const n = fn(s);
    if (n !== s) changed = true;
    return n;
  });
  return changed ? next : stories;
}

export function deskReducer(stories: Story[], action: DeskAction): Story[] {
  switch (action.type) {
    case 'desk/create':
      return [...stories, action.story];
    case 'desk/update':
      return patchStory(stories, action.id, (s) => ({ ...s, ...action.patch }));
    case 'desk/advance':
      return patchStory(stories, action.id, (s) => {
        if (!canAdvance(s).ok) return s;
        return { ...s, status: STATUSES[STATUSES.indexOf(s.status) + 1] };
      });
    case 'desk/retreat':
      return patchStory(stories, action.id, (s) => (canRetreat(s) ? { ...s, status: STATUSES[STATUSES.indexOf(s.status) - 1] } : s));
    case 'desk/toggleCheck':
      return patchStory(stories, action.id, (s) => ({
        ...s,
        checklist: s.checklist.map((c) => (c.id === action.itemId ? { ...c, done: !c.done } : c)),
      }));
    case 'desk/addCheck':
      return patchStory(stories, action.id, (s) => ({ ...s, checklist: [...s.checklist, action.item] }));
    case 'desk/addNote':
      return patchStory(stories, action.id, (s) => ({ ...s, notes: [...s.notes, action.note] }));
    case 'desk/resolveNote':
      return patchStory(stories, action.id, (s) => ({
        ...s,
        notes: s.notes.map((n) => (n.id === action.noteId ? { ...n, resolved: !n.resolved } : n)),
      }));
    case 'desk/setPages':
      return patchStory(stories, action.id, (s) => ({ ...s, ...clampPages(action.pageStart, action.pageCount) }));
    case 'desk/remove':
      return stories.filter((s) => s.id !== action.id);
  }
}
