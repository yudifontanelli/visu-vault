# VAULT

Workspace criativo privado da **Visuvault**. App multiplataforma (iPhone, Windows e macOS) feito com
**Expo SDK 57 + React Native 0.86 + React Native Web + TypeScript**.

> **Etapa 1 — demonstrativa.** O login pelo disco de combinação é simbólico: não há contas,
> credenciais, persistência nem acesso a dados privados. Nenhum serviço pago está configurado.

## Plataformas

| Plataforma | Como roda nesta etapa |
| --- | --- |
| **iPhone** (iOS) | App nativo via Expo. Durante o desenvolvimento: Expo Go ou development build. |
| **Windows** | Build web (React Native Web) no navegador; instalável como app (PWA) pelo Edge/Chrome. |
| **macOS** | Build web no Safari/Chrome; instalável como app (Safari › Arquivo › Adicionar ao Dock, ou PWA no Chrome). |

A interface é responsiva: no celular usa coluna única e barra superior; em janelas largas
(Windows/Mac) usa layout lado a lado na tela de bloqueio e barra lateral no workspace.

## Começando

Requer **Node.js 22.18+** (os testes usam o _type stripping_ nativo do Node).

```bash
npm install
npm run web     # abre no navegador (Windows / macOS)
npm start       # servidor Expo; escaneie o QR code com o app Expo Go no iPhone
```

## Verificações

```bash
npm run check      # typecheck (tsc) + lint (eslint-config-expo) + testes unitários
npm run build:web  # exporta o build web estático para dist/
```

## O disco de combinação

- Disco mecânico em 2.5D (SVG): aro chanfrado, borda serrilhada, escala **00–99** e anel interno com
  **V I S U V A U L T** no mesmo tamanho de fonte dos números. A luz é fixa e o disco gira por baixo dela,
  o que dá a sensação de profundidade.
- O centro é um **botão de apertar liso** — não há fechadura de chave.
- **Controle direto:** arraste com o dedo ou o mouse em volta do disco. Ao soltar, ele “encaixa” no número
  mais próximo (com vibração háptica no iPhone a cada número).
- **Registrar um número:** toque/clique no centro. No desktop também funcionam a roda do mouse, as setas
  (← → ↑ ↓, com Shift = 10 em 10) e Enter. No VoiceOver o disco é um controle ajustável.
- **Sequência simbólica 1294**, lida no disco de 00 a 99 como duas paradas: **12 → 94**.
  Errou um número: o disco recua, os campos são limpos e é só tentar de novo.
- **Desbloqueio:** o indicador acende, o disco dá uma volta completa, os quatro ferrolhos recolhem e a tela
  se abre para a Home.

A sequência está em `UNLOCK_SEQUENCE` (`src/lib/combination.ts`). Como fica no código do cliente, ela
**não é** um mecanismo de segurança — a autenticação real entra numa etapa futura.

O número 1294 não aparece na marca: o logo (ícone do app, favicon e marca na interface) é um disco sem
números.

## Home

Ambientes iniciais: **Brainstorm, Editorial, Projects, Library, Archive e Team**. Cada um abre sua própria
tela, com estado vazio e os módulos previstos. **Bloquear** volta para o disco.

## Estrutura

```
index.ts                     registro do app (nativo e web)
app.json                     configuração Expo (nome, ícones, splash escuro, PWA)
public/                      index.html e manifest da versão web/PWA
assets/                      ícones e splash do VAULT
src/
  App.tsx                    sessão demo: bloqueio ↔ workspace
  theme.ts                   paleta (preto, off-white, grafite), fontes, breakpoints
  lib/combination.ts         lógica pura do disco (geometria, encaixe, sequência)
  lib/combination.test.ts    testes unitários (node:test)
  components/CombinationDial.tsx   disco 2.5D + gestos, teclado, roda, haptics, animações
  components/VaultWordmark.tsx     marca VAULT
  components/EnvironmentIcon.tsx   ícones dos ambientes
  data/environments.ts       definição dos 6 ambientes
  hooks/                     responsividade e Animated.Value estável
  screens/LockScreen.tsx     tela inicial com o disco
  screens/WorkspaceScreen.tsx  Home e telas de ambiente
```

## Serviços

Nada pago ou externo foi configurado: sem EAS Build/Submit, sem hospedagem, sem CI, sem backend.
Para publicar na App Store será preciso uma conta Apple Developer (paga) — isso fica para quando
você autorizar.
