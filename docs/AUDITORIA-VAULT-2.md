# VAULT 2.0 — Auditoria do repositório (ETAPA 1)

Auditoria feita antes do redesign "Editorial + Mesa Criativa". O objetivo é atualizar o app sem reconstruí-lo do
zero e sem perder dados ou funções úteis.

- **Data:** 15/10/2026
- **Base auditada:** `claude/vault-initial-setup-v8hm3n` @ `97ac871`, que é o PR #1, ainda não integrado à `main`.
- **Branch do redesign:** `claude/vault-2-redesign`, criada a partir dessa base.

## 1. Estrutura e tecnologias

| Item | Estado atual |
| --- | --- |
| Framework | Expo SDK 57, React Native 0.86, React Native Web 0.21, React 19.2, TypeScript 6 (strict) |
| Plataformas | iPhone (Expo Go / build nativo), Windows e macOS (web/PWA) |
| Fontes | Instrument Serif, Instrument Sans e IBM Plex Mono (OFL, pacotes npm embutidos) |
| Gráficos | `react-native-svg` (disco, marca, gravuras, pranchas gerativas) |
| Estado | Store próprio (`createStore` + `useSyncExternalStore`), reducers puros por módulo |
| Testes | 54 testes de lógica pura (`node --test`), `tsc`, ESLint (`eslint-config-expo`) |
| E2E | Roteiro Playwright fora do repositório (6 viewports, 111 verificações), usado na revisão do PR #1 |
| CI | Nenhuma |

O código tem cerca de 10 mil linhas em `src/`. Os maiores arquivos são `CombinationDial.tsx` (747), `ProjectsScreen`
(429), `LibraryScreen` (394), `BrainstormScreen` (389), `seed.ts` (378) e `LockScreen` (371).

## 2. Telas e componentes

| Tela / módulo | Arquivo | Observação para o 2.0 |
| --- | --- | --- |
| Splash | `screens/SplashScreen.tsx` | Escudo de fechadura gravado e textura de papel. É "gravura vintage decorativa", que o 2.0 pede para evitar: rever na ETAPA 3/4. |
| Login (disco) | `screens/LockScreen.tsx`, `components/CombinationDial.tsx`, `lib/combination.ts` | Mecanismo a preservar. A sequência atual é **12 → 94**; no 2.0 passa a **01 → 02 → 09 → 04**. A mensagem de sucesso atual é "Acesso liberado."; no 2.0 será "Acesso autorizado." (ETAPA 4). |
| Shell | `screens/WorkspaceScreen.tsx`, `features/sections.ts`, `features/navigation.tsx` | Sumário lateral com 8 seções (00–07). No 2.0 serão 4 ambientes + menu secundário. |
| 00 Capa | `features/home/` | Vira **Início** (fundo off-white, ações e estados vazios). |
| 01 Brainstorm | `features/board/` | Já é uma mesa com arrastar, pan/zoom, encaixe, camadas e desfazer. É a base da **Mesa Criativa**. |
| 02 Editorial Desk | `features/editorial/` | Fluxo de revista impressa (prova, espelho de 32 páginas). Vira **Editorial** para Instagram. |
| 03 Projects | `features/projects/` | Produções com etapas e entregas. Não tem destino direto no 2.0: ver o mapa de migração. |
| 04 Library | `features/library/` | 24 pranchas **gerativas** (não são arquivos reais). |
| 05 Archive | `features/archive/` | Fichas catalográficas, ligadas a Projects. |
| 06 Study Room | `features/study/` | Dossiês com bibliografia e marginália. |
| 07 Team | `features/team/` | Equipe **fictícia** (7 pessoas). |

Os componentes do design system ficam em `src/design/`: tokens, fontes, `T`, Button, Field, Checkbox, Tabs, Dialog,
Toast, Sheet, primitives e gravuras.

A marca está em `components/VaultWordmark.tsx`:

- `VaultMark` é um anel de disco com indicador e botão, sem números. É o mesmo desenho do ícone do app.
- `VaultWordmark` mostra "VAULT" em Instrument Serif e "by VISUVAULT".

## 3. Persistência

- Os dados ficam **apenas no aparelho**: AsyncStorage no iPhone, localStorage no navegador.
- Chave `vault.workspace`, envelope `{ v, savedAt, state }` com **`STATE_VERSION = 1`**.
- A gravação tem intervalo de 400 ms e só começa depois da hidratação, para que o conteúdo demo nunca sobrescreva o
  que foi salvo.
- **Risco:** `deserialize` descarta o estado salvo quando a versão muda. Se o modelo mudar com uma simples troca de
  `STATE_VERSION`, quem já usa o app volta ao conteúdo demo e perde as edições locais.
- **Exigência do 2.0:** escrever uma migração `v1 → v2` testada antes de qualquer mudança no formato dos dados, e
  nunca simplesmente trocar a versão.
- O estado atual tem `board`, `desk`, `projects`, `archive`, `study` e `team`. A visão da mesa (pan e zoom) não é
  persistida.

## 4. Backend, contas e autenticação

- **Não há backend, contas, sessão nem permissões.** O login é o disco, com a sequência no código do cliente, ou
  seja, demonstração e não segurança.
- **Não há sincronização** entre aparelhos nem entre os fundadores. Cada aparelho tem a própria cópia local.
- **Consequência para o 2.0:**
  - A tela de perfis (YUDI, ANNE, GABRIELA) e o disco podem existir como **experiência**, mas, sem backend, escolher
    um perfil não pode ser apresentado como proteção de dados.
  - Até haver autenticação real, o app continua em **modo demonstrativo**, identificado como tal na interface, e não
    finge que os dados são compartilhados.
- Colaboração real (contas, permissões e dados compartilhados entre os três) exige um backend. Opções gratuitas para
  começar: Supabase ou Firebase. Isso depende da sua conta e da sua autorização, porque nada pago ou externo será
  configurado sem o seu aval.

## 5. Arquivos e mídia

- **Não há upload nem armazenamento de arquivos.**
  - As "imagens" da Library e da mesa são pranchas gerativas em SVG.
  - Os "documentos" do Archive são fichas de texto.
- O Acervo do 2.0 (imagens, links e documentos reais) precisa de:
  - seletor de arquivos: `expo-image-picker` / `expo-document-picker`, pacotes gratuitos;
  - armazenamento local ou em nuvem.
- Armazenamento local de imagens no navegador é limitado (cota de localStorage/IndexedDB). Para compartilhar
  arquivos entre os fundadores, é preciso armazenamento em nuvem, que entra na mesma decisão de backend.
- **Arquivos privados existentes no repositório:** nenhum. Os únicos binários são os ícones, a splash e duas texturas
  de grão geradas pelo projeto.

## 6. Versão publicada

- Não há hospedagem pública, EAS, App Store nem domínio.
- Existe uma **prévia privada** (artefato claude.ai, visível só na sua conta), feita a partir do commit `97ac871` do
  PR #1: https://claude.ai/artifact/WpkCQToibN57WUTjm7xixT
- Essa prévia **não será substituída** durante o redesign. As prévias do 2.0 serão publicadas em artefatos
  separados.

## 7. Tipografia e marca

| Pedido do 2.0 | Situação |
| --- | --- |
| Canela Regular 400 no logotipo VAULT | **Não há arquivos nem licença da Canela no projeto.** Canela é comercial (Commercial Type) e não será baixada nem incorporada sem licença. **Uso provisório: Georgia**, que é fonte do sistema no iPhone, no macOS e no Windows. A troca está centralizada em `src/design/fonts.ts` (`BRAND_FAMILY`). |
| Instrument Sans na interface funcional | Já está embutida. Na ETAPA 2, rótulos e microtipografia deixam a IBM Plex Mono e passam para Instrument Sans. |
| Logo minimalista com entrada de fechadura | **O arquivo aprovado não está no repositório.** Hoje há duas marcas: o anel de disco (`VaultMark` / ícone do app) e o escudo de fechadura gravado da splash, que é ornamental e não minimalista. Nenhuma das duas foi alterada. É preciso receber o arquivo aprovado (SVG de preferência). |
| 1294 fora da logo | Cumprido: a marca não tem números. |

## 8. Lacunas para as próximas etapas

| Precisa de você | Para |
| --- | --- |
| A **imagem de referência final** da tela de perfis, que não chegou nesta conversa | ETAPA 3 |
| As **fotos de fundo** dos três cards (monocromáticas, sem pessoas) e a confirmação dos direitos de uso | ETAPA 3 |
| O **arquivo da logo aprovada** (fechadura) | Todas as telas |
| A **licença e os arquivos da Canela**, ou a decisão de manter Georgia / outra serif livre | Logotipo |
| A **decisão sobre backend/autenticação** (local demonstrativo agora ou Supabase/Firebase com sua conta) | Perfis, colaboração, Acervo com arquivos |
| O **destino de Projects** (ver abaixo) | ETAPA 5–8 |

## 9. Mapa de migração (nada é apagado)

| Hoje | VAULT 2.0 | Como migra |
| --- | --- | --- |
| 00 Capa | **Início** | Redesenho: saudação ao perfil, "O que vamos criar hoje?", "Nova ideia", "Ver pautas", "Na mesa criativa", "Próximas publicações", "Atualizações importantes". Sem números inventados; estados vazios elegantes. |
| 01 Brainstorm | **Mesa Criativa** | Reaproveita mesa, viewport e testes. Itens `note`, `reference`, `plate` e `heading` passam a nota, link/referência, imagem e título. Novos: texto, comentário, conceito, redimensionar, "transformar em pauta". Posições continuam salvas. |
| 02 Editorial Desk | **Editorial** (Instagram) | `Story` ganha `formato` (Post, Carrossel, Reel, Story), `legenda`, `responsáveis`, `referências`, `arquivos` e `origemIdeiaId`. Etapas: Pauta/Apuração → **Ideia**, Redação → **Em análise**, Revisão → **Em produção**, Fechamento → **Pronto para publicar**, Publicado → **Publicado**. O espelho de 32 páginas (revista impressa) sai da interface, mas os dados das pautas são mantidos. Visões lista e calendário. Publicação manual (copiar legenda), sem API do Instagram. |
| 04 Library + 05 Archive | **Acervo** | Pranchas e fichas viram itens do Acervo com coleções, busca e filtros. As fichas continuam ligadas aos projetos de origem. Upload real depende da decisão de armazenamento. |
| 06 Study Room | **Acervo** (coleção "Estudos") | Dossiês e bibliografia passam a referências/documentos. A marginália vira nota. |
| 07 Team | **Menu secundário** | Equipe fictícia substituída pelos três fundadores **somente** quando houver perfis reais. Até lá, fica identificada como demonstração. |
| 03 Projects | **A decidir** | Proposta: projetos viram **coleções do Acervo** e pautas com prazo no Editorial, com as entregas como checklist da pauta. Não será removido até você aprovar. |

**Persistência:** cada linha acima que muda o formato dos dados entra numa migração `v1 → v2` com teste. Os dados
antigos são convertidos, nunca descartados.

## 10. Outros achados técnicos

- Os nomes de módulos e seções estão em inglês (`Brainstorm`, `Editorial Desk`, `Library`…) e a interface 2.0 será
  inteiramente em pt-BR. A renomeação acompanha a nova IA (ETAPA 5).
- Em modo dev, na web, há um aviso do React sobre `accessibilityElementsHidden` passado ao `<svg>` da `VaultMark`.
  **Corrigido na ETAPA 2.**
- A paleta 1.0 tinha uma cor de alerta (`oxide #B4442F`) fora da paleta oficial 2.0. **Removida na ETAPA 2.** Erros e
  atrasos passam a ser indicados por texto, peso e contraste, nunca só por cor.
- As texturas de grão estavam ligadas por padrão em todas as folhas. **Desligadas por padrão na ETAPA 2.**
- O ícone do app (anel de disco) e a splash (escudo gravado) serão revistos quando a logo aprovada chegar.
