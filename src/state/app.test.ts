/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { drawers, nextAccession, searchRecords } from '../features/archive/model.ts';
import { CATEGORIES, countByCategory, filterPlates, PLATES, plateById } from '../features/library/catalog.ts';
import { canArchive, progress } from '../features/projects/model.ts';
import { overallProgress, studyProgress, studyReducer } from '../features/study/model.ts';
import { MEMBERS, nextAvailability } from '../features/team/model.ts';
import { appReducer, isAppState, seedState } from './app.ts';

const TODAY = '2026-10-15';

describe('seed', () => {
  it('is a valid state referencing known people and plates', () => {
    const s = seedState(TODAY);
    assert.ok(isAppState(s));
    const ids = new Set(MEMBERS.map((m) => m.id));
    for (const st of s.desk) {
      assert.ok(ids.has(st.authorId) && ids.has(st.editorId), st.code);
    }
    for (const p of s.projects) assert.ok(ids.has(p.leadId), p.code);
    for (const it of s.board) if (it.kind === 'plate') assert.ok(plateById(it.plateId), it.id);
    for (const id of ids) assert.ok(s.team[id], id);
  });

  it('never prints the private sequence in brand data', () => {
    const blob = JSON.stringify([seedState(TODAY), PLATES]);
    assert.equal(blob.includes('1294'), false);
  });
});

describe('projects → archive', () => {
  it('archives only finished projects and creates a catalogue record', () => {
    const s = seedState(TODAY);
    const unfinished = s.projects.find((p) => p.id === 'pr-01');
    assert.ok(unfinished);
    assert.equal(canArchive(unfinished).ok, false);
    assert.equal(appReducer(s, { type: 'projects/archive', id: 'pr-01', recordId: 'r1', on: TODAY }), s);

    const done = s.projects.find((p) => p.id === 'pr-05');
    assert.ok(done && canArchive(done).ok);
    assert.equal(progress(done).ratio, 1);
    const next = appReducer(s, { type: 'projects/archive', id: 'pr-05', recordId: 'r1', on: TODAY });
    assert.equal(next.projects.find((p) => p.id === 'pr-05')?.archived, true);
    const record = next.archive[0];
    assert.equal(record.projectId, 'pr-05');
    assert.equal(record.accession, 'AV-2026-003');
    assert.match(record.location, /^Gaveta 01 · Pasta A$/);

    const restored = appReducer(next, { type: 'archive/restore', recordId: 'r1' });
    assert.equal(restored.archive.length, s.archive.length);
    assert.equal(restored.projects.find((p) => p.id === 'pr-05')?.archived, false);
  });

  it('files records in yearly drawers and searches without accents', () => {
    const s = seedState(TODAY);
    assert.equal(nextAccession(s.archive, 2030), 'AV-2030-001');
    const d = drawers(s.archive);
    assert.deepEqual(d.map((x) => x.year), [2026, 2025, 2024, 2023, 2022, 2021]);
    assert.equal(searchRecords(s.archive, 'silencio', null)[0].accession, 'AV-2022-001');
    assert.equal(searchRecords(s.archive, '', 2025).length, 3);
  });
});

describe('reducer routing', () => {
  it('returns the same state for unknown or no-op actions', () => {
    const s = seedState(TODAY);
    assert.equal(appReducer(s, { type: 'team/setAvailability', memberId: 'hd', availability: s.team.hd }), s);
    const changed = appReducer(s, { type: 'team/setAvailability', memberId: 'hd', availability: 'ausente' });
    assert.notEqual(changed, s);
    assert.equal(changed.desk, s.desk);
    assert.equal(nextAvailability('ausente'), 'disponivel');
  });
});

describe('library', () => {
  it('has 24 plates across 6 categories, with unique codes', () => {
    assert.equal(PLATES.length, 24);
    assert.equal(new Set(PLATES.map((p) => p.code)).size, 24);
    const counts = countByCategory(PLATES);
    for (const c of CATEGORIES) assert.equal(counts[c], 4);
  });

  it('filters by category and accent-insensitive text, and sorts', () => {
    assert.equal(filterPlates(PLATES, { category: 'Cinema', query: '' }).length, 4);
    assert.equal(filterPlates(PLATES, { category: null, query: 'reticula' }).length >= 2, true);
    const byTitle = filterPlates(PLATES, { category: null, query: '', sort: 'titulo' });
    assert.ok(byTitle[0].title.localeCompare(byTitle[1].title, 'pt') <= 0);
  });
});

describe('study room', () => {
  it('tracks reading progress', () => {
    const s = seedState(TODAY);
    const d = s.study[0];
    assert.deepEqual(studyProgress(d), { done: 2, total: 4, ratio: 0.5 });
    const next = studyReducer(s.study, { type: 'study/toggleReading', dossierId: d.id, readingId: d.readings[2].id });
    assert.equal(studyProgress(next[0]).done, 3);
    assert.ok(overallProgress(next) > overallProgress(s.study));
    const noted = studyReducer(s.study, { type: 'study/addNote', dossierId: d.id, note: { id: 'n', text: 'x', at: TODAY } });
    assert.equal(noted[0].notes[0].id, 'n');
  });
});
