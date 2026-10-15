import type { ISODate } from '../lib/dates.ts';
import { addDays } from '../lib/dates.ts';
import type { ArchiveRecord } from '../features/archive/model.ts';
import type { BoardItem } from '../features/board/model.ts';
import type { Story } from '../features/editorial/model.ts';
import type { Project } from '../features/projects/model.ts';
import type { Dossier } from '../features/study/model.ts';

/**
 * Demo content for the first session. Deadlines are relative to the day the
 * workspace is first opened, so the desk always shows something due.
 * People are fictional; studied works are real, published references.
 */

const c = (id: string, label: string, done = false) => ({ id, label, done });

export function seedBoard(): BoardItem[] {
  return [
    { id: 'b-h1', kind: 'heading', x: 96, y: 72, z: 1, text: 'Arquivo Vivo — direção de campanha' },
    { id: 'b-p1', kind: 'plate', x: 96, y: 192, z: 2, text: 'Retrato em retícula', plateId: 'pl-001' },
    { id: 'b-p2', kind: 'plate', x: 336, y: 216, z: 3, text: 'Molde, frente de casaco', plateId: 'pl-005' },
    { id: 'b-p3', kind: 'plate', x: 576, y: 168, z: 4, text: 'Interferência nº 3', plateId: 'pl-007' },
    { id: 'b-n1', kind: 'note', x: 840, y: 192, z: 5, text: 'Luz dura de fim de tarde. Sombras longas fazem a composição — nada de rebatedor.' },
    { id: 'b-n2', kind: 'note', x: 840, y: 384, z: 6, text: 'Paleta: só tinta e papel. A cor aparece apenas no figurino, e pouca.' },
    { id: 'b-r1', kind: 'reference', x: 1104, y: 192, z: 7, text: 'Folhas de contato: editar pelo erro', source: 'Study Room · D-01' },
    { id: 'b-p4', kind: 'plate', x: 96, y: 504, z: 8, text: 'Água-forte, ondas', plateId: 'pl-011' },
    { id: 'b-n3', kind: 'note', x: 336, y: 528, z: 9, text: 'Casting: rostos com memória. Nada de perfeição de catálogo.' },
    { id: 'b-r2', kind: 'reference', x: 1104, y: 360, z: 10, text: 'Cartazes suíços dos anos 1960', source: 'Library · Tipografia' },
    { id: 'b-h2', kind: 'heading', x: 576, y: 600, z: 11, text: 'Filme de 30 segundos' },
    { id: 'b-n4', kind: 'note', x: 576, y: 696, z: 12, text: 'Um plano só, sem corte. A câmera anda como quem procura um arquivo.' },
  ];
}

export function seedDesk(today: ISODate): Story[] {
  return [
    {
      id: 's-01',
      code: 'P-01',
      title: 'O arquivo como método',
      dek: 'Guardar não é acumular: é escolher o que o futuro poderá ver.',
      section: 'Ensaio',
      authorId: 'hd',
      editorId: 'nv',
      deadline: addDays(today, 2),
      status: 'revisao',
      wordsTarget: 1800,
      pageStart: 4,
      pageCount: 6,
      body:
        'Todo arquivo começa como um gesto de recusa. Antes de guardar, alguém decide o que não será guardado, e essa decisão desenha o contorno do que chamaremos, mais tarde, de memória.\n\n' +
        'Nas gavetas de um estúdio, o arquivo não é depósito. É uma ferramenta de trabalho: folhas de contato com quadros marcados, provas recusadas, moldes que nunca viraram roupa. O que não foi publicado explica o que foi.\n\n' +
        'Este ensaio percorre três arquivos — de um fotógrafo, de um ateliê e de uma revista — para propor que arquivar é, antes de tudo, um método de olhar.',
      checklist: [c('s01-c1', 'Checagem de fatos', true), c('s01-c2', 'Créditos de imagem'), c('s01-c3', 'Legendas revisadas', true)],
      notes: [
        { id: 's01-n1', authorId: 'nv', text: 'Conferir a data da primeira exposição citada no segundo parágrafo.', at: addDays(today, -1), resolved: false },
        { id: 's01-n2', authorId: 'cm', text: 'Abertura pede imagem sangrada na página dupla 4–5.', at: addDays(today, -2), resolved: true },
      ],
    },
    {
      id: 's-02',
      code: 'P-02',
      title: 'Silhuetas em suspensão',
      dek: 'A alfaiataria desmontada e remontada por uma nova geração de ateliês.',
      section: 'Moda',
      authorId: 'rv',
      editorId: 'hd',
      deadline: addDays(today, 6),
      status: 'redacao',
      wordsTarget: 1400,
      pageStart: 10,
      pageCount: 6,
      body:
        'O ombro desce dois centímetros e o casaco muda de época. Nos ateliês que visitamos, a alfaiataria é tratada como língua: tem gramática, mas aceita sotaque.\n\n' +
        'Há moldes abertos sobre as mesas, marcados a giz, e peças viradas do avesso para que a costura apareça.',
      checklist: [c('s02-c1', 'Produção de moda fotografada', true), c('s02-c2', 'Créditos das peças'), c('s02-c3', 'Texto de abertura')],
      notes: [],
    },
    {
      id: 's-03',
      code: 'P-03',
      title: 'Luz de tungstênio',
      dek: 'Como o cinema noturno inventou uma cor para a cidade.',
      section: 'Cinema',
      authorId: 'bl',
      editorId: 'hd',
      deadline: addDays(today, 9),
      status: 'apuracao',
      wordsTarget: 1600,
      pageStart: null,
      pageCount: 4,
      body: '',
      checklist: [c('s03-c1', 'Entrevista com diretor de fotografia'), c('s03-c2', 'Seleção de fotogramas')],
      notes: [],
    },
    {
      id: 's-04',
      code: 'P-04',
      title: 'Retícula e memória',
      dek: 'O ponto de impressão como matéria da lembrança fotográfica.',
      section: 'Fotografia',
      authorId: 'lo',
      editorId: 'cm',
      deadline: addDays(today, 14),
      status: 'pauta',
      wordsTarget: 1200,
      pageStart: null,
      pageCount: 6,
      body: '',
      checklist: [c('s04-c1', 'Levantamento de acervo')],
      notes: [],
    },
    {
      id: 's-05',
      code: 'P-05',
      title: 'Cartazes suíços, ruído urbano',
      dek: 'A grade tipográfica encontra o muro, a chuva e a cola.',
      section: 'Design',
      authorId: 'ta',
      editorId: 'cm',
      deadline: addDays(today, 1),
      status: 'fechamento',
      wordsTarget: 900,
      pageStart: 16,
      pageCount: 4,
      body:
        'Um cartaz bem composto não sobrevive intacto à rua. A cola escorre, outro cartaz cobre metade do primeiro, a chuva lava a tinta. E, ainda assim, a grade resiste.\n\n' +
        'Fotografamos durante um mês os mesmos dez muros para registrar como a ordem tipográfica envelhece.',
      checklist: [c('s05-c1', 'Fotos dos muros', true), c('s05-c2', 'Legendas', true), c('s05-c3', 'Revisão final', true)],
      notes: [{ id: 's05-n1', authorId: 'nv', text: 'Uniformizar a grafia dos anos (1960, não 60).', at: addDays(today, -3), resolved: true }],
    },
    {
      id: 's-06',
      code: 'P-06',
      title: 'Uma galeria sem paredes',
      dek: 'Entrevista sobre exposições que acontecem no espaço da página.',
      section: 'Arte',
      authorId: 'hd',
      editorId: 'nv',
      deadline: addDays(today, 18),
      status: 'pauta',
      wordsTarget: 1500,
      pageStart: 29,
      pageCount: 2,
      body: '',
      checklist: [c('s06-c1', 'Agendar entrevista')],
      notes: [],
    },
    {
      id: 's-07',
      code: 'P-07',
      title: 'Folhas de prova de uma geração',
      dek: 'Doze fotógrafos abrem suas folhas de contato pela primeira vez.',
      section: 'Fotografia',
      authorId: 'lo',
      editorId: 'hd',
      deadline: addDays(today, -12),
      status: 'publicado',
      wordsTarget: 1000,
      pageStart: 20,
      pageCount: 6,
      body: 'O quadro escolhido é sempre uma promessa; os vizinhos dele contam como a promessa foi feita.',
      checklist: [c('s07-c1', 'Autorizações de imagem', true)],
      notes: [],
    },
    {
      id: 's-08',
      code: 'P-08',
      title: 'O figurino como roteiro',
      dek: 'Quando a roupa conta a história antes do diálogo.',
      section: 'Cinema',
      authorId: 'bl',
      editorId: 'rv',
      deadline: addDays(today, -1),
      status: 'revisao',
      wordsTarget: 1300,
      pageStart: 26,
      pageCount: 4,
      body:
        'Antes da primeira fala, o figurino já disse quem é a personagem, de onde vem e o que perdeu. Em muitos filmes, o roteiro é costurado.\n\n' +
        'Conversamos com figurinistas sobre a decisão mais difícil do ofício: o que a roupa não deve contar.',
      checklist: [c('s08-c1', 'Checagem de filmografia'), c('s08-c2', 'Fotogramas licenciados', true)],
      notes: [{ id: 's08-n1', authorId: 'hd', text: 'Abrir com a cena do casaco; cortar o segundo parágrafo pela metade.', at: addDays(today, -1), resolved: false }],
    },
  ];
}

export function seedProjects(today: ISODate): Project[] {
  return [
    {
      id: 'pr-01',
      code: 'PR-01',
      title: 'Arquivo Vivo',
      kind: 'Campanha',
      partner: 'Ateliê Norte',
      leadId: 'rv',
      start: addDays(today, -30),
      due: addDays(today, 21),
      stage: 'producao',
      summary: 'Campanha de inverno fotografada em acervos e ateliês: roupa como documento.',
      deliverables: [
        c('pr01-d1', 'Moodboard aprovado', true),
        c('pr01-d2', 'Casting', true),
        c('pr01-d3', 'Fotografia de campanha'),
        c('pr01-d4', 'Filme de 30 segundos'),
        c('pr01-d5', 'Peças para impressão'),
      ],
      archived: false,
    },
    {
      id: 'pr-02',
      code: 'PR-02',
      title: 'Papel & Prata',
      kind: 'Exposição',
      partner: 'Galeria Lume',
      leadId: 'lo',
      start: addDays(today, -12),
      due: addDays(today, 45),
      stage: 'pre',
      summary: 'Exposição de cópias em prata e provas de contato do acervo da revista.',
      deliverables: [
        c('pr02-d1', 'Seleção de imagens', true),
        c('pr02-d2', 'Projeto expográfico'),
        c('pr02-d3', 'Catálogo'),
        c('pr02-d4', 'Textos de parede'),
      ],
      archived: false,
    },
    {
      id: 'pr-03',
      code: 'PR-03',
      title: 'Noturno nº 2',
      kind: 'Filme',
      partner: 'Coletivo Vigília',
      leadId: 'bl',
      start: addDays(today, -60),
      due: addDays(today, 12),
      stage: 'pos',
      summary: 'Curta-metragem rodado com luz de tungstênio, em continuidade ao primeiro Noturno.',
      deliverables: [
        c('pr03-d1', 'Montagem final', true),
        c('pr03-d2', 'Mixagem de som'),
        c('pr03-d3', 'Legendas'),
        c('pr03-d4', 'Cartaz', true),
      ],
      archived: false,
    },
    {
      id: 'pr-04',
      code: 'PR-04',
      title: 'Edição especial: cinema e moda',
      kind: 'Edição especial',
      partner: 'VISUVAULT',
      leadId: 'hd',
      start: addDays(today, -3),
      due: addDays(today, 60),
      stage: 'briefing',
      summary: 'Número temático sobre figurino, guarda-roupa e personagem.',
      deliverables: [c('pr04-d1', 'Pauta geral'), c('pr04-d2', 'Orçamento')],
      archived: false,
    },
    {
      id: 'pr-05',
      code: 'PR-05',
      title: 'Identidade do Festival Imagem Aberta',
      kind: 'Identidade',
      partner: 'Festival Imagem Aberta',
      leadId: 'ta',
      start: addDays(today, -90),
      due: addDays(today, 2),
      stage: 'entrega',
      summary: 'Marca, sistema tipográfico e sinalização para um festival de fotografia.',
      deliverables: [
        c('pr05-d1', 'Marca', true),
        c('pr05-d2', 'Sistema tipográfico', true),
        c('pr05-d3', 'Sinalização', true),
        c('pr05-d4', 'Manual de uso', true),
      ],
      archived: false,
    },
  ];
}

export function seedArchive(): ArchiveRecord[] {
  const r = (
    accession: string,
    title: string,
    kind: ArchiveRecord['kind'],
    archivedOn: ISODate,
    location: string,
    summary: string,
    tags: string[],
  ): ArchiveRecord => ({ id: `ar-${accession}`, accession, title, kind, year: Number(archivedOn.slice(0, 4)), archivedOn, location, summary, tags });
  return [
    r('AV-2026-001', 'VISUVAULT nº 06 — Superfícies', 'Edição', '2026-03-02', 'Gaveta 01 · Pasta A', 'Número dedicado à pele das coisas: papel, tecido, película.', ['revista', 'superfície']),
    r('AV-2026-002', 'Linha d’Água', 'Campanha', '2026-05-18', 'Gaveta 01 · Pasta A', 'Campanha de primavera fotografada em piscinas públicas vazias.', ['campanha', 'água']),
    r('AV-2025-001', 'VISUVAULT nº 05 — Ruído', 'Edição', '2025-09-20', 'Gaveta 02 · Pasta A', 'Interferência, erro e grão como linguagem.', ['revista', 'ruído']),
    r('AV-2025-002', 'Sala Escura', 'Exposição', '2025-06-11', 'Gaveta 02 · Pasta A', 'Mostra de ampliações feitas ao vivo no laboratório.', ['exposição', 'laboratório']),
    r('AV-2025-003', 'A cor do arquivo', 'Ensaio', '2025-02-03', 'Gaveta 02 · Pasta A', 'Ensaio visual sobre o amarelecimento do papel.', ['ensaio', 'papel']),
    r('AV-2024-001', 'VISUVAULT nº 04 — Corpo', 'Edição', '2024-10-05', 'Gaveta 03 · Pasta A', 'Moda, dança e anatomia em um só número.', ['revista', 'corpo']),
    r('AV-2024-002', 'Sal', 'Filme', '2024-07-22', 'Gaveta 03 · Pasta A', 'Curta em preto e branco rodado em salinas.', ['filme', 'paisagem']),
    r('AV-2024-003', 'Identidade Ateliê Norte', 'Identidade', '2024-03-14', 'Gaveta 03 · Pasta A', 'Sistema de marca para um ateliê de alfaiataria.', ['identidade', 'alfaiataria']),
    r('AV-2023-001', 'VISUVAULT nº 03 — Cidade', 'Edição', '2023-11-10', 'Gaveta 04 · Pasta A', 'A cidade lida como arquivo de camadas.', ['revista', 'cidade']),
    r('AV-2023-002', 'Papel Carbono', 'Exposição', '2023-05-29', 'Gaveta 04 · Pasta A', 'Cópias, duplicatas e o valor do segundo exemplar.', ['exposição', 'cópia']),
    r('AV-2022-001', 'VISUVAULT nº 02 — Silêncio', 'Edição', '2022-10-01', 'Gaveta 05 · Pasta A', 'Páginas brancas, pausas e o que fica fora do quadro.', ['revista', 'silêncio']),
    r('AV-2021-001', 'VISUVAULT nº 01 — Origem', 'Edição', '2021-09-15', 'Gaveta 06 · Pasta A', 'Primeiro número: manifesto, arquivo e método.', ['revista', 'origem']),
  ];
}

export function seedStudy(today: ISODate): Dossier[] {
  const read = (id: string, kind: Dossier['readings'][number]['kind'], title: string, author: string, year: number, done = false) => ({
    id,
    kind,
    title,
    author,
    year,
    done,
  });
  return [
    {
      id: 'd-01',
      code: 'D-01',
      title: 'O olhar fotográfico',
      theme: 'Fotografia',
      description: 'Como a fotografia ensina a ver — e o que ela esconde ao mostrar.',
      readings: [
        read('d01-r1', 'Livro', 'Sobre fotografia', 'Susan Sontag', 1977, true),
        read('d01-r2', 'Livro', 'A câmara clara', 'Roland Barthes', 1980, true),
        read('d01-r3', 'Ensaio', 'Pequena história da fotografia', 'Walter Benjamin', 1931),
        read('d01-r4', 'Livro', 'Modos de ver', 'John Berger', 1972),
      ],
      notes: [
        { id: 'd01-n1', text: 'Barthes: o detalhe que fere. Procurar isso nas folhas de contato do acervo, não só nas fotos escolhidas.', at: addDays(today, -4) },
        { id: 'd01-n2', text: 'Sontag sobre coleção: fotografar como forma de possuir. Ligar à pauta P-04.', at: addDays(today, -9) },
      ],
    },
    {
      id: 'd-02',
      code: 'D-02',
      title: 'Cinema: tempo e corte',
      theme: 'Cinema',
      description: 'O corte como pensamento: montagem, duração e elipse.',
      readings: [
        read('d02-r1', 'Livro', 'Notas sobre o cinematógrafo', 'Robert Bresson', 1975, true),
        read('d02-r2', 'Filme', 'Um homem com uma câmera', 'Dziga Vertov', 1929),
        read('d02-r3', 'Filme', 'Hiroshima, meu amor', 'Alain Resnais', 1959, true),
        read('d02-r4', 'Filme', 'Acossado', 'Jean-Luc Godard', 1960),
      ],
      notes: [{ id: 'd02-n1', text: 'Para Noturno nº 2: testar o falso raccord como Godard, mas com luz, não com corte.', at: addDays(today, -2) }],
    },
    {
      id: 'd-03',
      code: 'D-03',
      title: 'Moda como linguagem',
      theme: 'Moda',
      description: 'A roupa como sistema de signos, memória e desejo.',
      readings: [
        read('d03-r1', 'Livro', 'Sistema da moda', 'Roland Barthes', 1967),
        read('d03-r2', 'Livro', 'O império do efêmero', 'Gilles Lipovetsky', 1987, true),
        read('d03-r3', 'Livro', 'Adorned in Dreams', 'Elizabeth Wilson', 1985),
      ],
      notes: [],
    },
    {
      id: 'd-04',
      code: 'D-04',
      title: 'Grade e tipografia',
      theme: 'Design',
      description: 'A disciplina da grade e a liberdade que ela permite.',
      readings: [
        read('d04-r1', 'Livro', 'Grid systems in graphic design', 'Josef Müller-Brockmann', 1981),
        read('d04-r2', 'Livro', 'A interação da cor', 'Josef Albers', 1963, true),
        read('d04-r3', 'Livro', 'Die neue Typographie', 'Jan Tschichold', 1928),
        read('d04-r4', 'Livro', 'Elementos do estilo tipográfico', 'Robert Bringhurst', 1992),
      ],
      notes: [{ id: 'd04-n1', text: 'Testar a grade de 12 colunas do VAULT contra as proporções de Müller-Brockmann.', at: addDays(today, -6) }],
    },
  ];
}
