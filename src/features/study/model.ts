import type { ISODate } from '../../lib/dates.ts';

/** Study Room: research dossiers with reading lists and margin notes. */

export const READING_KINDS = ['Livro', 'Ensaio', 'Filme', 'Exposição'] as const;
export type ReadingKind = (typeof READING_KINDS)[number];

export interface Reading {
  id: string;
  kind: ReadingKind;
  title: string;
  author: string;
  year: number | null;
  done: boolean;
}

export interface StudyNote {
  id: string;
  text: string;
  at: ISODate;
}

export interface Dossier {
  id: string;
  code: string;
  title: string;
  theme: string;
  description: string;
  readings: Reading[];
  notes: StudyNote[];
}

export type StudyAction =
  | { type: 'study/toggleReading'; dossierId: string; readingId: string }
  | { type: 'study/addReading'; dossierId: string; reading: Reading }
  | { type: 'study/removeReading'; dossierId: string; readingId: string }
  | { type: 'study/addNote'; dossierId: string; note: StudyNote }
  | { type: 'study/removeNote'; dossierId: string; noteId: string };

export function studyProgress(d: Pick<Dossier, 'readings'>): { done: number; total: number; ratio: number } {
  const total = d.readings.length;
  const done = d.readings.filter((r) => r.done).length;
  return { done, total, ratio: total === 0 ? 0 : done / total };
}

export function overallProgress(dossiers: readonly Dossier[]): number {
  const all = dossiers.flatMap((d) => d.readings);
  return all.length === 0 ? 0 : all.filter((r) => r.done).length / all.length;
}

function patch(dossiers: Dossier[], id: string, fn: (d: Dossier) => Dossier): Dossier[] {
  return dossiers.map((d) => (d.id === id ? fn(d) : d));
}

export function studyReducer(dossiers: Dossier[], action: StudyAction): Dossier[] {
  switch (action.type) {
    case 'study/toggleReading':
      return patch(dossiers, action.dossierId, (d) => ({
        ...d,
        readings: d.readings.map((r) => (r.id === action.readingId ? { ...r, done: !r.done } : r)),
      }));
    case 'study/addReading':
      return patch(dossiers, action.dossierId, (d) => ({ ...d, readings: [...d.readings, action.reading] }));
    case 'study/removeReading':
      return patch(dossiers, action.dossierId, (d) => ({ ...d, readings: d.readings.filter((r) => r.id !== action.readingId) }));
    case 'study/addNote':
      return patch(dossiers, action.dossierId, (d) => ({ ...d, notes: [action.note, ...d.notes] }));
    case 'study/removeNote':
      return patch(dossiers, action.dossierId, (d) => ({ ...d, notes: d.notes.filter((n) => n.id !== action.noteId) }));
  }
}
