import type { ISODate } from '../../lib/dates.ts';
import type { Project } from '../projects/model.ts';

/** Archive: catalogue records of finished work, filed in drawers by year. */

export const RECORD_KINDS = ['Edição', 'Campanha', 'Exposição', 'Filme', 'Ensaio', 'Identidade', 'Edição especial'] as const;
export type RecordKind = (typeof RECORD_KINDS)[number];

export interface ArchiveRecord {
  id: string;
  /** Accession number, e.g. "AV-2024-007". */
  accession: string;
  title: string;
  kind: RecordKind;
  year: number;
  archivedOn: ISODate;
  location: string;
  summary: string;
  tags: string[];
  /** Set when the record came from a project and can be restored to it. */
  projectId?: string;
}

export function nextAccession(records: readonly ArchiveRecord[], year: number): string {
  const prefix = `AV-${year}-`;
  const max = records
    .filter((r) => r.accession.startsWith(prefix))
    .reduce((m, r) => Math.max(m, Number(r.accession.slice(prefix.length)) || 0), 0);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

/** Drawer (gaveta) and folder where a new record is filed: one drawer per year. */
export function locationFor(records: readonly ArchiveRecord[], year: number): string {
  const years = [...new Set([...records.map((r) => r.year), year])].sort((a, b) => b - a);
  const drawer = String(years.indexOf(year) + 1).padStart(2, '0');
  const count = records.filter((r) => r.year === year).length;
  const folder = String.fromCharCode(65 + Math.min(25, Math.floor(count / 4)));
  return `Gaveta ${drawer} · Pasta ${folder}`;
}

export function recordFromProject(project: Project, records: readonly ArchiveRecord[], recordId: string, archivedOn: ISODate): ArchiveRecord {
  const year = Number(archivedOn.slice(0, 4));
  return {
    id: recordId,
    accession: nextAccession(records, year),
    title: project.title,
    kind: project.kind,
    year,
    archivedOn,
    location: locationFor(records, year),
    summary: project.summary,
    tags: [project.kind.toLowerCase(), project.partner.toLowerCase()],
    projectId: project.id,
  };
}

export function drawers(records: readonly ArchiveRecord[]): { year: number; count: number }[] {
  const counts = new Map<number, number>();
  for (const r of records) counts.set(r.year, (counts.get(r.year) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[0] - a[0]).map(([year, count]) => ({ year, count }));
}

function normalise(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function searchRecords(records: readonly ArchiveRecord[], query: string, year: number | null): ArchiveRecord[] {
  const q = normalise(query.trim());
  return records
    .filter((r) => year === null || r.year === year)
    .filter((r) => !q || normalise([r.title, r.accession, r.kind, r.summary, ...r.tags].join(' ')).includes(q))
    .sort((a, b) => b.archivedOn.localeCompare(a.archivedOn) || b.accession.localeCompare(a.accession));
}
