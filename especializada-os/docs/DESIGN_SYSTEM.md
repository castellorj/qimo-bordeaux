# Design System

Premium SaaS, denso e calmo, feito para uso o dia inteiro. Referências **conceituais** (não copiar): Linear (velocidade, teclado, densidade), Stripe (clareza de dados e hierarquia tipográfica), Notion (calma, espaço em branco), HubSpot (CRM e pipeline familiares). Tokens implementados em [`tailwind.config.ts`](../tailwind.config.ts).

## 1. Princípios visuais

1. **Dados primeiro** — cor é informação (status, ramo, DEMO), não decoração.
2. **Densidade confortável** — tabelas compactas (linhas de 40 px), cartões com respiro.
3. **Origem visível** — todo dado crítico pode mostrar de onde veio.
4. **Uma ação primária por tela.**
5. **Teclado em tudo** que se repete.

## 2. Tokens

### Cores

| Token | Valor | Uso |
|---|---|---|
| `brand-50 … 950` | `#eef4ff` · `#dae6ff` · `#bcd2ff` · `#8eb4ff` · `#598bff` · `#3366f5` · **`#1f4fe0` (600)** · `#1a3fb5` · `#1b378f` · `#1c3271` · `#0f1d45` | Ação primária (`brand-600`, hover `700`), links, foco (`brand-500`), seleção (`brand-50`) |
| `ink` / `ink-soft` / `ink-muted` / `ink-faint` | `#0f172a` / `#334155` / `#64748b` / `#94a3b8` | Texto: títulos e valores / corpo / secundário e rótulos / placeholders e desabilitado |
| `line` / `line-soft` | `#e5e7eb` / `#f1f5f9` | Bordas / divisórias internas e zebra |
| `canvas` | `#f8fafc` | Fundo da aplicação |
| `surface` | `#ffffff` | Cartões, tabelas, drawers |
| `ok` / `ok-soft` | `#059669` / `#ecfdf5` | Sucesso, vigente, recebida |
| `warn` / `warn-soft` | `#d97706` / `#fffbeb` | Atenção, vencendo, expirando |
| `danger` / `danger-soft` | `#dc2626` / `#fef2f2` | Erro, vencida, divergente, ação destrutiva |
| `demo` / `demo-soft` | `#a21caf` / `#fdf4ff` | **Exclusivo para sinalizar a DEMO e dados fictícios.** Nunca usar para outra finalidade |

Contraste (calculado, WCAG 2.1):

| Combinação | Razão | AA texto normal (4,5) |
|---|---|---|
| `ink-muted` sobre `surface` / `canvas` | 4,76 / 4,55 | ✔ |
| branco sobre `brand-600` | ≈ 6,5 | ✔ |
| branco sobre `demo` | ≈ 6,4 | ✔ |
| branco sobre `danger` | ≈ 4,8 | ✔ |
| branco sobre `ok` (`#059669`) | ≈ 3,8 | ✖ (só texto ≥ 18,66 px bold / ícones) |
| branco sobre `warn` (`#d97706`) | ≈ 3,2 | ✖ |
| `ok` sobre `ok-soft` | ≈ 3,7 | ✖ |
| `warn` sobre `warn-soft` | ≈ 3,1 | ✖ |

**Proposta de ajuste de tokens:** adicionar `ok.strong = #047857` (emerald-700) e `warn.strong = #b45309` (amber-700) para **texto** de badges sobre `*-soft` (ambos ≥ 4,5:1), mantendo `ok`/`warn` para ícones, bordas e preenchimentos. `ink-faint` só para placeholder/desabilitado.

Dark mode: `darkMode: "class"` habilitado no Tailwind; tokens escuros a definir (fora da Fase 0).

### Tipografia

- **Inter** (variável `--font-sans`, fallback `system-ui`), `font-feature-settings: "cv11", "tnum"` em números de tabela (algarismos tabulares).
- Escala: `2xs` 11/16 (chips, metadados) · `xs` 12/16 · `sm` 14/20 (padrão de UI e tabelas) · `base` 16/24 (texto longo, proposta) · `lg` 18 · `xl` 20 (título de seção) · `2xl` 24 (título de página) · `3xl` 30 (KPI).
- Pesos: 400 corpo, 500 rótulos/botões, 600 títulos e valores.

### Espaçamento, raio e sombra

- Grade de 4 px (escala Tailwind). Padrões: padding de cartão `p-5`, gap entre cartões `gap-4`, página `px-6 py-6`.
- Raio: `rounded-md` (6 px) controles; `rounded-lg` (8 px) cartões; `rounded-full` chips/avatares.
- Sombra: `shadow-card` (cartões em repouso), `shadow-pop` (menus, popovers, ⌘K, drawers).

## 3. Layout

```
┌──────────┬──────────────────────────────────────────────────────────┐
│          │ Topbar: [⌘K Buscar clientes, apólices, placas…] [+ Novo] [🔔] [Usuário ▾]  [DEMO] │
│ Sidebar  ├──────────────────────────────────────────────────────────┤
│ 240 px   │ Cabeçalho da página (título, breadcrumbs, ação primária)  │
│          │ Conteúdo (max-w-7xl, fluido em tabelas)                   │
└──────────┴──────────────────────────────────────────────────────────┘
```

- **Sidebar (240 px, recolhível para 64 px):** grupos — *Hoje* (Dashboard, Operações, Tarefas) · *Clientes* (Clientes, Famílias, Empresas, CRM) · *Vendas* (Cotações, Propostas, Rede credenciada, Seguradoras) · *Carteira* (Apólices, Renovações, Comissões, Documentos) · *Inteligência* (Especializada AI, Relatórios, Automações) · *Admin* (Importar, Configurações). Itens sem permissão não aparecem.
- **Topbar:** busca global (abre ⌘K), "+ Novo" (menu: cliente, empresa, cotação, tarefa, upload), alertas (contagem), usuário (papel, trocar usuário na DEMO), badge **DEMO** fixo.
- **Desktop-first** (1280–1600 px). Tablet: sidebar recolhida. Mobile (≥ 360 px): sidebar em drawer, tabelas viram listas de cartões, Kanban com rolagem horizontal; página pública de proposta é **mobile-first** (cliente abre no WhatsApp).

## 4. Componentes

| Componente | Especificação |
|---|---|
| **Button** | `primary` (brand-600, texto branco), `secondary` (surface + borda line, texto ink), `ghost` (sem borda, hover line-soft), `danger` (danger, texto branco; exige confirmação). Tamanhos `sm` 32 px / `md` 36 px. Estados: hover, focus (anel 2 px brand-500 com offset), disabled, loading (spinner, mantém largura). Ícone opcional (lucide, 16 px) |
| **Badge** | Pílula `2xs`/`xs`, fundo `*-soft` + texto `*.strong` (ver contraste) + ícone: status de apólice, proposta, renovação, integração. Variante `demo` |
| **Card** | surface, borda line, `rounded-lg`, `shadow-card`, cabeçalho com título + ação secundária |
| **KPI / Stat** | Rótulo (`xs`, ink-muted), valor (`3xl`, 600, tabular), variação (seta + %, ok/danger), sparkline opcional, chip de fonte no rodapé |
| **Table** | Cabeçalho **sticky**, ordenação por coluna, barra de filtros (chips removíveis + "salvar visão"), seleção em lote, ações por linha no hover, paginação ou virtualização (> 200 linhas), números à direita e tabulares, estado vazio e carregando (skeleton) |
| **Tabs** | Sublinhado brand-600 na ativa; navegação por setas; aba refletida na URL |
| **Kanban** | Coluna: título + contagem + soma de prêmio; cartão: cliente, ícone do ramo, prêmio, dias no estágio, avatar do dono; drag-and-drop com alternativa por teclado/menu "Mover para…" |
| **Drawer / Dialog** | Drawer lateral (480–640 px) para detalhes rápidos sem perder contexto; Dialog para confirmações; foco preso, `Esc` fecha, retorno de foco |
| **Command palette (⌘K)** | Busca global fuzzy em clientes, empresas, apólices (nº), placas, propostas, prestadores; seções; ações ("Nova cotação para…", "Ir para Renovações"); navegação por setas; resultados filtrados por RBAC |
| **Empty state** | Ícone discreto, frase do que fazer, ação primária ("Importar carteira", "Criar primeira cotação"); estado "Tudo em dia" positivo na Central de Operações |
| **Toast** | Canto inferior direito, 4 s, com "Desfazer" quando aplicável; erros persistem até fechar; `aria-live="polite"` |
| **Source chip (proveniência)** | `2xs`, ink-muted, ícone de origem: "Fonte: Documento apólice.pdf · atualizado em 03/10/2026" / "Fonte: Tabela {operadora} · válida até …" / "Fonte: cálculo {adapter} · 07/10 08:41". Clique abre detalhes (quem confirmou, confiança). Em dados DEMO: "Fonte: dados fictícios DEMO" em `demo` |
| **Confidence indicator** | Para campos extraídos por IA: barra/ponto ≥ 0,85 ok · 0,6–0,85 warn · < 0,6 danger, com % no tooltip; campo crítico abaixo do limiar exige confirmação (borda warn + ícone) |
| **Product line icon** | Ícone + cor por ramo, sempre o par (nunca só cor) |
| **Banner DEMO** | Faixa fina `demo-soft` com texto `demo`: "Ambiente de demonstração — dados fictícios. Não insira dados reais." + "Restaurar dados" |

### Ícones e cores por ramo (lucide)

Fonte da verdade: `PRODUCTS` em [`src/domain/products.ts`](../src/domain/products.ts) (campos `icon` e `color`). Tabela espelhada aqui:

| Ramo | Ícone | Cor |
|---|---|---|
| Saúde | `HeartPulse` | `#e11d48` |
| Auto | `Car` | `#2563eb` |
| Vida | `Shield` | `#7c3aed` |
| Residencial | `Home` | `#059669` |
| Empresarial | `Building2` | `#0891b2` |
| Viagem | `Plane` | `#0ea5e9` |
| Odontológico | `Smile` | `#14b8a6` |
| Condomínio | `Building` | `#64748b` |
| Fiança locatícia | `KeyRound` | `#ca8a04` |
| Responsabilidade civil | `Scale` | `#9333ea` |
| Cyber | `ShieldAlert` | `#4f46e5` |
| Transportes | `Truck` | `#ea580c` |
| Náutico | `Sailboat` | `#0284c7` |
| Aeronáutico | `PlaneTakeoff` | `#475569` |
| Garantia | `FileCheck2` | `#16a34a` |
| Previdência | `PiggyBank` | `#db2777` |
| Equipamentos | `Wrench` | `#78716c` |
| Outros | `Package` | `#71717a` |

Regras: ícone e cor sempre juntos (nunca só cor); a cor do ramo é usada em ícones, chips e bordas, não como fundo de texto longo. **Observações para revisão:** (1) Residencial usa `#059669`, igual ao token `ok` — pode confundir com "sucesso"; sugerir outro tom (ex.: lima `#65a30d`; âmbar não serve porque colide com `warn`). (2) RC `#9333ea` é roxo próximo do fúcsia `demo` (`#a21caf`) — manter distinção ou ajustar para índigo, já que fúcsia é reservado à DEMO.

## 5. Atalhos de teclado

| Atalho | Ação |
|---|---|
| `⌘K` / `Ctrl+K` | Busca global / command palette |
| `/` | Focar filtro da tabela atual |
| `N` | Novo (menu "+ Novo") |
| `G` `D` | Ir para Dashboard |
| `G` `O` | Ir para Central de Operações |
| `G` `C` | Clientes |
| `G` `P` | Pipeline (CRM) |
| `G` `R` | Renovações |
| `G` `A` | Especializada AI |
| `J` / `K` | Próximo / anterior item em listas |
| `Enter` | Abrir item |
| `E` | Concluir tarefa selecionada |
| `?` | Ajuda de atalhos |
| `Esc` | Fechar drawer/dialog |

Atalhos de uma tecla são desativados quando o foco está em campo de texto.

## 6. Acessibilidade (WCAG 2.1 AA)

- Contraste AA (ver tokens); nunca informação só por cor (ícone/texto junto).
- Foco visível em todos os elementos interativos; ordem de tabulação lógica; *skip link* para o conteúdo.
- Componentes com semântica nativa ou ARIA correta (tabs, dialog, combobox do ⌘K, listbox).
- Drag-and-drop do Kanban com alternativa por teclado.
- Alvos de toque ≥ 24×24 px (≥ 44 px na página pública mobile).
- `prefers-reduced-motion` respeitado; animações ≤ 200 ms.
- Formulários: rótulos visíveis, erros associados (`aria-describedby`), máscaras sem bloquear colar.
- Mapas: lista textual equivalente aos marcadores.
- Idioma `pt-BR` no `<html>`; datas `dd/mm/aaaa`, moeda `R$ 1.234,56` (`Intl`).
