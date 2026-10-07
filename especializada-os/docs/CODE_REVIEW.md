# Revisão geral do código — Especializada Seguros OS

Data: 07/10/2026 · Escopo: todo o subprojeto `especializada-os/` (≈11,7 mil linhas TypeScript) · Feita após a [análise de segurança](SECURITY_ASSESSMENT.md).

## 1. Resultado

| Indicador | Antes | Depois |
|---|---|---|
| JavaScript carregado por página (primeira visita) | ~372–394 KB | **~166–184 KB (−53%)** |
| Fontes | Baixadas do Google a cada acesso | Servidas pelo próprio sistema (mais rápido e sem enviar IP ao Google) |
| Erros de tipagem | 0 | 0 |
| Linter (regras do Next.js + React Hooks + TypeScript) | não configurado | **configurado, 0 avisos** |
| Testes de domínio | 21 | 21 (todos passam) |
| Testes no navegador | scripts fora do repositório | **no repositório** (`npm run e2e`): 35 telas + 18 etapas de jornadas + decisões de negócio, todos passando |
| Vulnerabilidades em dependências | 0 (após a análise de segurança) | 0 |

## 2. O que foi enxugado e otimizado

1. **Ícones (maior ganho):** o sistema importava a biblioteca inteira de ícones (>1.500 ícones) em todas as páginas. Agora uma lista explícita (`src/components/ui/icons.ts`) leva só os ~150 usados. Resultado: metade do peso de cada página.
2. **Fonte própria:** a fonte Inter é baixada no build (`next/font`) e servida pelo domínio do sistema. Isso remove uma ida ao Google no carregamento e permitiu apertar a política de segurança de conteúdo (sem `fonts.googleapis.com`).
3. **Estado global mais eficiente:**
   - A fila de prioridades da Central era calculada 3 vezes por mudança (barra lateral, alertas e dashboard); agora é calculada uma vez e compartilhada.
   - A gravação no navegador (JSON de ~240 KB) acontecia a cada alteração; agora é agrupada (400 ms) e garantida ao fechar a página.
   - As funções de permissão e o objeto do contexto passaram a ser memorizados, evitando recálculos em cascata.
4. **Código duplicado removido:** o mesmo auxiliar de auditoria/histórico estava copiado em 5 arquivos de casos de uso; agora existe um só (`src/data/history.ts`). O nome do cliente era resolvido por duas funções iguais; ficou uma.
5. **Código morto removido:** funções sem uso (`partyEmail`, `isClient`, `linesOf`, `propertyOf`, `resultDiff`, `dateShort`, `DEMO_DISTRICT_NAMES`) e importações sobrando.
6. **IDs mais seguros:** identificadores passaram de `Math.random` para aleatoriedade criptográfica (`crypto.randomUUID`), eliminando risco de colisão.
7. **Ferramentas de qualidade:** ESLint configurado (`npm run lint`), verificação completa em um comando (`npm run check` = tipos + linter + testes) e testes de navegador versionados (`npm run e2e`).

## 3. Pontos fortes da base

- **Regras de negócio isoladas e testáveis:** prioridade da Central, saúde (faixas ANS, rede, recomendação), automações, cross-sell, busca, importação, conciliação e IA são funções puras em `src/domain` e `src/data`. Na produção elas passam a rodar no servidor sem reescrita.
- **Integrações atrás de contratos:** seguradoras, mapas, WhatsApp, e-mail, IA, storage e leitura de documentos ficam em `src/integrations`, cada uma trocável sem tocar no resto.
- **Nada inventado:** valores vêm de dados e tabelas; a IA da DEMO é determinística e sempre cita a fonte; automações são idempotentes (rodar duas vezes não duplica).
- **Tipagem estrita** em todo o projeto e modelo de domínio único (`src/domain/types.ts`) espelhado no schema Prisma.

## 4. Medições de desempenho

| Item | Medida | Avaliação |
|---|---|---|
| Geração dos dados DEMO no navegador | ~23 ms | ok |
| Serialização do banco DEMO | ~1 ms, ~240 KB | ok (gravação agrupada) |
| Busca global | varredura em memória a cada tecla | ok para milhares de registros; na produção vai para Postgres (`pg_trgm`/`unaccent`) |
| Mapa (Leaflet) | carregado só na tela de rede (import dinâmico) | ok |

## 5. Recomendações para as próximas etapas (não urgentes)

| Prioridade | Recomendação | Motivo |
|---|---|---|
| Alta (ao ligar o servidor) | Substituir o store do navegador por dados do servidor (Server Components / server actions) mantendo os mesmos casos de uso | Hoje toda mudança re-renderiza as telas que usam o store; com servidor, cada tela busca só o que precisa |
| Média | Dividir os maiores arquivos de tela em componentes: `configuracoes` (518 linhas), `cotacoes/nova` (387), `importar` (362), `DocumentReview` (324) | Manutenção e revisão mais fáceis |
| Média | Unificar os dois contratos de adapter de seguradora (`types.ts` da DEMO e `contract.ts` de produção) quando o primeiro conector real entrar | Evitar dois caminhos para a mesma coisa |
| Média | Rodar `npm run check` e `npm run e2e` no CI a cada mudança (GitHub Actions) | Impedir regressões |
| Baixa | Auditoria de acessibilidade (contraste, teclado, leitores de tela) | Qualidade e inclusão |
| Baixa | Virtualizar listas longas (tabelas com milhares de linhas) quando a carteira real for importada | Fluidez com volume |

## 6. Como rodar as verificações

```bash
cd especializada-os
npm run check            # tipos + linter + testes de domínio
npm run build && npm start
npx playwright install chromium   # uma vez
npm run e2e              # testes no navegador (com o sistema rodando em :3100)
```
