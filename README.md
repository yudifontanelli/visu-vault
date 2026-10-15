# VAULT

Sistema editorial proprietário da **VISUVAULT**: um workspace criativo privado para arte, moda, cinema e cultura
visual. Multiplataforma (iPhone, Windows e macOS) com **Expo SDK 57 + React Native 0.86 + React Native Web +
TypeScript**.

> **Sessão demonstrativa.** O login pelo disco de combinação é simbólico: não há contas nem credenciais e nada
> é enviado para fora do aparelho. As edições do workspace ficam salvas **apenas neste dispositivo** (AsyncStorage
> no iPhone, localStorage no navegador) e podem ser restauradas para o conteúdo de demonstração. Nenhum serviço
> pago está configurado.

## VAULT 2.0 — em andamento

Redesign "Editorial + Mesa Criativa" para os três fundadores produzirem conteúdo para o Instagram. O trabalho
acontece na branch `claude/vault-2-redesign`, sem substituir a versão atual antes dos testes.

| Etapa | Estado |
| --- | --- |
| 1 · Auditoria | Concluída: [`docs/AUDITORIA-VAULT-2.md`](docs/AUDITORIA-VAULT-2.md) |
| 2 · Design system e tipografia | Concluída: paleta oficial, logotipo, Instrument Sans na interface, ícones, contraste testado |
| 3–10 · Perfis, login, Início, Mesa Criativa, Editorial, Acervo, responsividade, prévia | Pendentes. Dependem dos materiais listados na auditoria. |

**Logotipo:** VAULT deve ser composto em Canela Regular 400. Não há licença nem arquivos dessa fonte no projeto, então
**o logotipo usa Georgia provisoriamente**. A troca é feita num só lugar (`BRAND_FAMILY` em `src/design/fonts.ts`).

**Espécime do design system:** `npm run web` e abra `http://localhost:8081/?sistema`.

## Direção de arte (1.0)

Estrutura contemporânea, alma editorial vintage.

- **Estrutura do produto — moderna:** grids editoriais, hierarquia clara, componentes modulares, responsivo.
- **Identidade e atmosfera — vintage-editorial:** gravuras em traço, fechaduras e chaves, arquivos, papel com
  grão, carimbos, marcas de impressão (registro e corte), índice com pontilhado.
- **Dosagem por área:** a splash e o login carregam a atmosfera; Archive, Library e Study Room levam mais da
  linguagem histórica; Brainstorm e Projects são os mais funcionais, só com detalhes de identidade.
- **Evitar:** retrô total, teatralidade, excesso de textura ou ilustração, cara de SaaS / dashboard corporativo.

### Telas

| | |
| --- | --- |
| **Splash** | Página de rosto impressa em papel, com escudo de fechadura gravado. A fechadura é um recorte real: ela se abre e revela o login. Toque para pular; com “reduzir movimento”, é só um esmaecimento. |
| **Login** | O disco de combinação em 2.5D continua sendo a referência: escala 00–99, anel **VISUVAULT** no mesmo corpo dos números, centro liso (sem fechadura), sequência simbólica **12 → 94**. Agora tem metal grafite quente, inscrição gravada no aro e uma ficha de arquivo ao lado. |
| **00 Capa** | Masthead, quadro da edição, matéria mais urgente, números da edição, sumário com pontilhado e pranchas recém-catalogadas. Tudo vem do estado real. |
| **01 Brainstorm** | Mesa de direção criativa (2400 × 1600): notas, referências, imagens e títulos arrastáveis. Pan e zoom com roda, ⌘/Ctrl, pinça ou trackpad; encaixe na grade, organizar automático, inspector com camadas, atalhos de teclado e desfazer exclusão. |
| **02 Editorial Desk** | Galé de pautas por etapa, prova impressa editável (colunas, capitular, contador de palavras), painel de produção e espelho da edição de 32 páginas com conflitos. O fluxo tem regras: texto antes da revisão, checklist e notas resolvidas antes do fechamento, páginas antes de publicar. |
| **03 Projects** | Tabela de produções com etapas, responsáveis, prazos e entregas. Um projeto entregue é arquivado e vira ficha no Archive. |
| **04 Library** | Acervo curado de 24 pranchas gerativas (meio-tom, película, moldes, moiré, guilhochê, espécimes, gravura…). Tem categorias, busca, ordenação e visualização ampliada sobre papel; folheia com ← → ou deslizando; leva a prancha para a mesa. |
| **05 Archive** | Gavetas por ano, fichas com o fio vermelho das bibliotecas e ficha catalográfica com carimbo e selo guilhochê. Uma ficha que veio de um projeto pode ser retirada do arquivo e o projeto volta a Projects. |
| **06 Study Room** | Dossiês de estudo como um livro aberto: bibliografia à esquerda (com obras de referência reais) e marginália à direita. |
| **07 Team** | Expediente da revista, com disponibilidade e as pautas e projetos de cada pessoa (equipe fictícia). |

Desktop (Windows/macOS) não é o mobile ampliado: tem sumário lateral numerado, fólio com data e hora e
painéis lado a lado (três painéis no Editorial Desk acima de 1440 px). No iPhone, a Capa é o índice e cada módulo
abre listas e depois o detalhe.

## Design system (`src/design/`)

| Arquivo | Conteúdo |
| --- | --- |
| `tokens.ts` | Paleta oficial 2.0, só quatro cores: preto `#0A0A0A`, off-white `#F5F1E8`, grafite `#262626` e cinza quente `#A8A39A`, com a rampa intermediária derivada delas. `emphasis` dá ênfase de erro/atraso sem cor extra. Também espaçamento (base 4), raios quase nulos, fios, sombras leves, layout, durações e curvas de movimento. |
| `fonts.ts` | Logotipo em Canela Regular 400; por enquanto **Georgia, provisória**, até haver licença. Instrument Sans em todo o texto funcional e Instrument Serif nos títulos editoriais (OFL, embutidas). IBM Plex Mono só na inscrição do aro do disco e nas pranchas gerativas. Há fallback para fontes do sistema. |
| `Typography.tsx` | `T` com variantes (`wordmark`, `display`, `headline`, `title`, `subtitle`, `caption`, `body`, `label`, `micro`, `numeral`…), espacejamento em em, algarismos tabulares, escala menor no celular e cor automática por superfície. |
| `Icon.tsx` | Ícones de traço único (grade 24): os quatro ambientes (`inicio`, `mesa`, `editorial`, `acervo`) e as ações. |
| `contrast.ts` | Cálculo de contraste WCAG. Os testes garantem AA para todo papel de texto em cada superfície. |
| `Specimen.tsx` | Espécime vivo do sistema (`?sistema` na web). |
| `primitives.tsx` | Fios (`Rule` simples/duplo), pontilhado de índice, `Tag`, `Stamp` (carimbo), `Monogram`, `Meter`. |
| `Button`, `Field`, `Checkbox`, `Tabs`, `Dialog`, `Toast` | Controles quadrados com rótulo mono, campos sublinhados, checklist com traço de caneta, abas com fio deslizante, formulários como fichas de papel, avisos discretos com ação. |
| `Sheet.tsx` | Folha off-white sobre a mesa escura, com sombra leve e marcas de corte opcionais. O grão vem desligado por padrão. |
| `SectionHeader`, `Page`, `Reveal`, `Hoverable` | Abertura de seção, margens editoriais, entrada editorial (respeita “reduzir movimento”) e estados de hover/press. |
| `engravings/` | Gravuras procedurais em SVG (escudo de fechadura, chave antiga, roseta guilhochê, marca de registro) com geometria pura testada. |
| `motion.ts`, `haptics.ts` | Animações com driver nativo e feedback tátil no iPhone. |

**Regras de uso:**
- Texto pequeno sobre preto usa no mínimo `graphite400` (≥4,5:1, inclusive sobre a superfície elevada). Sobre
  off-white, no mínimo `graphite500` (≈6,7:1). O cinza quente nunca é texto pequeno sobre off-white (2,2:1).
- Não há cor de alerta. Erros, conflitos e atrasos são ditos em palavras e com a ênfase máxima da superfície.
- O logotipo VAULT só aparece pelo componente `VaultWordmark` (VISUVAULT® sobre VAULT), nunca digitado com `<T>`.
- A marca nunca contém números (nem 1294).

## Começando

Requer **Node.js 22.18+** (os testes usam o _type stripping_ nativo do Node).

```bash
npm install
npm run web     # navegador (Windows / macOS)
npm start       # servidor Expo; escaneie o QR code com o Expo Go no iPhone
```

No disco: arraste em volta, toque ou clique no centro para registrar. No desktop também funcionam a roda do
mouse, as setas (Shift = 10) e Enter. A dica da sequência demo está em “Modo demonstrativo · ver dica”.

## Verificações

```bash
npm run check      # tsc + eslint (eslint-config-expo) + 59 testes unitários
npm run build:web  # build estático em dist/
```

Os testes cobrem a lógica pura: disco, datas, mesa (encaixe, organizar sem sobreposição, z-order), viewport
(zoom no cursor, enquadrar), fluxo editorial e espelho, arquivamento entre Projects e Archive, catálogo,
estudos, persistência versionada, gravuras e contraste da paleta.

## Estrutura

```
src/
  App.tsx                 fontes → splash → login → workspace
  design/                 design system (tokens, tipografia, componentes, gravuras, motion)
  components/             disco de combinação e marca
  screens/                Splash, Lock e Workspace (shell com sumário)
  features/               módulos: home, board, editorial, projects, library, archive, study, team
                          (cada um com model.ts puro + telas)
  state/                  estado do app, conteúdo de demonstração, store com persistência local
  store/                  createStore e persistência genéricos
  lib/                    combinação, datas, PRNG
```

## Limitações conhecidas

- O app nativo para iOS compila (bundle Hermes), mas ainda não foi aberto num iPhone ou simulador nesta etapa:
  teste com o Expo Go (`npm start`).
- No Windows e no macOS o VAULT roda como app web instalável (PWA). Um app de desktop nativo é uma decisão para
  outra etapa.
- A sequência do disco fica no código do cliente: é demonstração, não segurança.
- As imagens da Library são estudos gerativos. A importação de imagens próprias fica para uma próxima etapa.

## Serviços

Nada pago ou externo foi configurado: sem EAS, hospedagem, CI ou backend. As fontes vêm de pacotes npm (OFL)
embutidos no app. Para publicar na App Store será preciso uma conta Apple Developer (paga), quando você
autorizar.
