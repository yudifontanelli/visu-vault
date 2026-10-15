/**
 * Brainstorm board: a creative-direction table. Items live in board units on a
 * fixed-size world; the view (pan/zoom) is UI state and never persisted.
 */

export type BoardItemKind = 'note' | 'reference' | 'plate' | 'heading';

export interface BoardItem {
  id: string;
  kind: BoardItemKind;
  x: number;
  y: number;
  z: number;
  /** Note body, reference title, heading text or plate caption. */
  text: string;
  /** Reference source (URL or citation). */
  source?: string;
  /** Library plate shown by `plate` items. */
  plateId?: string;
}

export const BOARD = { width: 2400, height: 1600, grid: 24 } as const;

export const ITEM_SIZE: Record<BoardItemKind, { w: number; h: number }> = {
  note: { w: 216, h: 168 },
  reference: { w: 264, h: 132 },
  plate: { w: 216, h: 288 },
  heading: { w: 456, h: 72 },
};

export const KIND_LABEL: Record<BoardItemKind, string> = {
  note: 'Nota',
  reference: 'Referência',
  plate: 'Imagem',
  heading: 'Título',
};

export type BoardAction =
  | { type: 'board/add'; item: BoardItem }
  | { type: 'board/move'; id: string; x: number; y: number }
  | { type: 'board/update'; id: string; patch: Partial<Pick<BoardItem, 'text' | 'source'>> }
  | { type: 'board/remove'; id: string }
  | { type: 'board/front'; id: string }
  | { type: 'board/duplicate'; id: string; newId: string }
  | { type: 'board/arrange' };

export function snap(value: number, grid: number = BOARD.grid): number {
  return Math.round(value / grid) * grid;
}

/** Keeps an item fully on the table. */
export function clampToBoard(kind: BoardItemKind, x: number, y: number): { x: number; y: number } {
  const { w, h } = ITEM_SIZE[kind];
  return {
    x: Math.min(Math.max(0, x), BOARD.width - w),
    y: Math.min(Math.max(0, y), BOARD.height - h),
  };
}

export function maxZ(items: readonly BoardItem[]): number {
  return items.reduce((m, it) => Math.max(m, it.z), 0);
}

export function bounds(items: readonly BoardItem[]): { x: number; y: number; w: number; h: number } | null {
  if (items.length === 0) return null;
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const it of items) {
    const { w, h } = ITEM_SIZE[it.kind];
    x1 = Math.min(x1, it.x);
    y1 = Math.min(y1, it.y);
    x2 = Math.max(x2, it.x + w);
    y2 = Math.max(y2, it.y + h);
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

const ARRANGE_ORDER: BoardItemKind[] = ['heading', 'plate', 'note', 'reference'];

/**
 * Tidy layout: headings on their own rows, then plates, notes and references
 * shelved left to right, wrapping at `rowWidth`. Snapped to the grid, z kept.
 */
export function arrange(items: readonly BoardItem[], origin = { x: 96, y: 96 }, rowWidth = 1416, gap = 24): BoardItem[] {
  const sorted = [...items].sort(
    (a, b) => ARRANGE_ORDER.indexOf(a.kind) - ARRANGE_ORDER.indexOf(b.kind) || a.y - b.y || a.x - b.x,
  );
  const placed = new Map<string, { x: number; y: number }>();
  let x = origin.x;
  let y = origin.y;
  let rowH = 0;
  let prevKind: BoardItemKind | null = null;
  for (const it of sorted) {
    const { w, h } = ITEM_SIZE[it.kind];
    const kindChanged = prevKind !== null && prevKind !== it.kind;
    const overflow = x > origin.x && x + w > origin.x + rowWidth;
    if (it.kind === 'heading' || kindChanged || overflow || prevKind === 'heading') {
      if (x > origin.x || prevKind === 'heading') {
        y += rowH + gap;
      }
      x = origin.x;
      rowH = 0;
    }
    placed.set(it.id, { x: snap(x), y: snap(y) });
    x += w + gap;
    rowH = Math.max(rowH, h);
    prevKind = it.kind;
  }
  return items.map((it) => {
    const p = placed.get(it.id);
    if (!p) return it;
    const c = clampToBoard(it.kind, p.x, p.y);
    return c.x === it.x && c.y === it.y ? it : { ...it, ...c };
  });
}

export function boardReducer(items: BoardItem[], action: BoardAction): BoardItem[] {
  switch (action.type) {
    case 'board/add': {
      const c = clampToBoard(action.item.kind, action.item.x, action.item.y);
      return [...items, { ...action.item, ...c, z: maxZ(items) + 1 }];
    }
    case 'board/move': {
      return items.map((it) => {
        if (it.id !== action.id) return it;
        const c = clampToBoard(it.kind, action.x, action.y);
        return c.x === it.x && c.y === it.y ? it : { ...it, ...c };
      });
    }
    case 'board/update':
      return items.map((it) => (it.id === action.id ? { ...it, ...action.patch } : it));
    case 'board/remove':
      return items.filter((it) => it.id !== action.id);
    case 'board/front': {
      const top = maxZ(items);
      const target = items.find((it) => it.id === action.id);
      if (!target || (target.z === top && items.filter((i) => i.z === top).length === 1)) return items;
      return items.map((it) => (it.id === action.id ? { ...it, z: top + 1 } : it));
    }
    case 'board/duplicate': {
      const src = items.find((it) => it.id === action.id);
      if (!src) return items;
      const c = clampToBoard(src.kind, src.x + BOARD.grid, src.y + BOARD.grid);
      return [...items, { ...src, id: action.newId, ...c, z: maxZ(items) + 1 }];
    }
    case 'board/arrange':
      return arrange(items);
  }
}
