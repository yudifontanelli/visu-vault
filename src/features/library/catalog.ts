/**
 * Library catalogue (demo collection). Every plate is a generative study drawn
 * in-app, in ink and paper only — no third-party images, no licensing.
 */

export const CATEGORIES = ['Fotografia', 'Cinema', 'Moda', 'Arte', 'Tipografia', 'Gravura'] as const;
export type Category = (typeof CATEGORIES)[number];

export type PlateStyle =
  | 'halftone'
  | 'contact'
  | 'filmstrip'
  | 'aspect'
  | 'pattern'
  | 'drape'
  | 'moire'
  | 'rosette'
  | 'specimen'
  | 'grid'
  | 'hatch'
  | 'stipple';

export interface Plate {
  id: string;
  /** Catalogue code, e.g. "VV·L·014". */
  code: string;
  title: string;
  category: Category;
  style: PlateStyle;
  seed: number;
  /** Year catalogued. */
  year: number;
  technique: string;
  format: string;
  note: string;
  tags: string[];
}

type Entry = Omit<Plate, 'id' | 'code' | 'year'>;

const ENTRIES: Entry[] = [
  { title: 'Retrato em retícula', category: 'Fotografia', style: 'halftone', seed: 11, technique: 'Meio-tom, retícula de 45°', format: '4:5', note: 'Estudo de como a retícula de impressão transforma luz em ponto.', tags: ['retícula', 'retrato', 'impressão'] },
  { title: 'Folha de contato, rolo 4', category: 'Fotografia', style: 'contact', seed: 23, technique: 'Prova de contato, 12 quadros', format: '4:5', note: 'Sequência de quadros com marcações de edição a lápis.', tags: ['contato', 'edição', 'sequência'] },
  { title: 'Película, plano e contraplano', category: 'Cinema', style: 'filmstrip', seed: 37, technique: 'Tira de película 35 mm', format: '4:5', note: 'Ritmo de montagem lido como partitura gráfica.', tags: ['montagem', 'película', 'ritmo'] },
  { title: 'Janelas de projeção', category: 'Cinema', style: 'aspect', seed: 41, technique: 'Sobreposição de formatos de tela', format: '4:5', note: '1.37, 1.85 e 2.39: o quadro como decisão de linguagem.', tags: ['formato', 'quadro', 'projeção'] },
  { title: 'Molde, frente de casaco', category: 'Moda', style: 'pattern', seed: 53, technique: 'Molde plano com margens de costura', format: '4:5', note: 'Peças de alfaiataria com piques, fio e pences.', tags: ['alfaiataria', 'molde', 'corte'] },
  { title: 'Caimento, estudo de dobras', category: 'Moda', style: 'drape', seed: 67, technique: 'Linhas de dobra em tecido pesado', format: '4:5', note: 'O peso do tecido descrito apenas por linhas.', tags: ['caimento', 'tecido', 'dobra'] },
  { title: 'Interferência nº 3', category: 'Arte', style: 'moire', seed: 71, technique: 'Moiré de círculos concêntricos', format: '4:5', note: 'Duas tramas quase iguais produzem uma terceira imagem.', tags: ['moiré', 'óptica', 'trama'] },
  { title: 'Roseta de segurança', category: 'Arte', style: 'rosette', seed: 83, technique: 'Guilhochê, ornamento de valor', format: '4:5', note: 'Ornamento de cédulas e certificados, tornado imagem.', tags: ['guilhochê', 'ornamento', 'valor'] },
  { title: 'Espécime, caixa-alta', category: 'Tipografia', style: 'specimen', seed: 97, technique: 'Prova tipográfica com linhas-guia', format: '4:5', note: 'Altura de versal, linha de base e eixo da letra.', tags: ['tipo', 'espécime', 'serifa'] },
  { title: 'Grade de doze colunas', category: 'Tipografia', style: 'grid', seed: 101, technique: 'Composição modular suíça', format: '4:5', note: 'A grade como disciplina e como liberdade.', tags: ['grid', 'suíço', 'composição'] },
  { title: 'Água-forte, ondas', category: 'Gravura', style: 'hatch', seed: 113, technique: 'Hachura ondulada, buril', format: '4:5', note: 'Volume construído por linhas paralelas que se curvam.', tags: ['buril', 'hachura', 'onda'] },
  { title: 'Pontilhado, esfera', category: 'Gravura', style: 'stipple', seed: 127, technique: 'Pontilhismo em ponta-seca', format: '4:5', note: 'Densidade de pontos como única fonte de sombra.', tags: ['pontilhado', 'volume', 'sombra'] },
  { title: 'Retícula em grão grosso', category: 'Fotografia', style: 'halftone', seed: 131, technique: 'Meio-tom ampliado', format: '4:5', note: 'Ampliação até o ponto deixar de ser imagem.', tags: ['retícula', 'ampliação', 'grão'] },
  { title: 'Folha de contato, rolo 9', category: 'Fotografia', style: 'contact', seed: 139, technique: 'Prova de contato, 12 quadros', format: '4:5', note: 'Quadros escolhidos marcados com círculo e cruz.', tags: ['contato', 'seleção', 'arquivo'] },
  { title: 'Película, noturno', category: 'Cinema', style: 'filmstrip', seed: 149, technique: 'Tira de película 35 mm', format: '4:5', note: 'Quadros escuros, luz como exceção.', tags: ['noturno', 'película', 'luz'] },
  { title: 'Janelas, estudo II', category: 'Cinema', style: 'aspect', seed: 157, technique: 'Formatos sobrepostos', format: '4:5', note: 'Margens pretas como parte da composição.', tags: ['formato', 'letterbox', 'quadro'] },
  { title: 'Molde, manga e punho', category: 'Moda', style: 'pattern', seed: 163, technique: 'Molde plano com piques', format: '4:5', note: 'Peças pequenas, precisão de relojoaria.', tags: ['molde', 'manga', 'precisão'] },
  { title: 'Caimento, seda', category: 'Moda', style: 'drape', seed: 173, technique: 'Linhas de dobra em tecido leve', format: '4:5', note: 'Dobras longas, quase líquidas.', tags: ['seda', 'caimento', 'linha'] },
  { title: 'Interferência nº 7', category: 'Arte', style: 'moire', seed: 181, technique: 'Moiré de linhas paralelas', format: '4:5', note: 'Pequenos ângulos, grandes ondas.', tags: ['moiré', 'linha', 'vibração'] },
  { title: 'Roseta dupla', category: 'Arte', style: 'rosette', seed: 191, technique: 'Guilhochê em dois anéis', format: '4:5', note: 'Precisão mecânica que parece feita à mão.', tags: ['guilhochê', 'mecânica', 'anel'] },
  { title: 'Espécime, itálico', category: 'Tipografia', style: 'specimen', seed: 197, technique: 'Prova tipográfica', format: '4:5', note: 'Inclinação, contraste e ritmo do itálico.', tags: ['itálico', 'espécime', 'ritmo'] },
  { title: 'Grade, cartaz', category: 'Tipografia', style: 'grid', seed: 211, technique: 'Composição modular', format: '4:5', note: 'Blocos, fios e um único círculo fora da grade.', tags: ['cartaz', 'grid', 'tensão'] },
  { title: 'Água-forte, relevo', category: 'Gravura', style: 'hatch', seed: 223, technique: 'Hachura cruzada', format: '4:5', note: 'Duas direções de linha descrevem uma superfície.', tags: ['hachura', 'relevo', 'cruzada'] },
  { title: 'Pontilhado, eclipse', category: 'Gravura', style: 'stipple', seed: 229, technique: 'Pontilhismo', format: '4:5', note: 'Um disco que se apaga ponto a ponto.', tags: ['pontilhado', 'eclipse', 'disco'] },
];

export const PLATES: readonly Plate[] = ENTRIES.map((e, i) => ({
  ...e,
  id: `pl-${String(i + 1).padStart(3, '0')}`,
  code: `VV·L·${String(i + 1).padStart(3, '0')}`,
  year: 2026,
}));

export function plateById(id: string | undefined): Plate | undefined {
  return PLATES.find((p) => p.id === id);
}

export type PlateSort = 'catalogo' | 'titulo' | 'categoria';

function normalise(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function filterPlates(
  plates: readonly Plate[],
  { category, query, sort = 'catalogo' }: { category: Category | null; query: string; sort?: PlateSort },
): Plate[] {
  const q = normalise(query.trim());
  const out = plates.filter(
    (p) =>
      (category === null || p.category === category) &&
      (!q || normalise([p.title, p.code, p.category, p.technique, ...p.tags].join(' ')).includes(q)),
  );
  if (sort === 'titulo') out.sort((a, b) => a.title.localeCompare(b.title, 'pt'));
  else if (sort === 'categoria') out.sort((a, b) => a.category.localeCompare(b.category, 'pt') || a.code.localeCompare(b.code));
  else out.sort((a, b) => a.code.localeCompare(b.code));
  return out;
}

export function countByCategory(plates: readonly Plate[]): Record<Category, number> {
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
  for (const p of plates) counts[p.category] += 1;
  return counts;
}
