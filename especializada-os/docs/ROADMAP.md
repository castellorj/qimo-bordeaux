# Roadmap

Legenda de dependências: **D** dados · **A** API · **C** contrato/parceria. Os critérios de aceite referenciam as jornadas de [USER_FLOWS §17](USER_FLOWS.md).

> As Fases 1–6 seguem exatamente a sequência do briefing (§45). Como a DEMO (Fase 0) já exercita todas elas com dados fictícios, cada fase real consiste em trocar o repositório local por Postgres/servidor e conectar as fontes reais daquele escopo.

---

## Fase 0 — DEMO navegável (esta entrega)

**Objetivo:** validar fluxos e a proposta de valor com a equipe da corretora, sem infraestrutura, contratos ou dados reais.

**Cobre:**
- Login por seletor de papel (admin, gestor, corretor, operacional, financeiro) e RBAC na UI; restrição de carteira configurável.
- Dashboard com KPIs e horas economizadas; Central de Operações priorizada.
- Clientes (cadastro "digitar uma vez", Cliente 360), Famílias, Empresas, CRM (Kanban + lista).
- Cotação de saúde completa (beneficiários → faixas ANS → hospitais desejados → recomendação → comparação → rede) e auto com multicálculo **simulado**; fluxo genérico para os demais ramos.
- Rede credenciada (por endereço, por plano, por prestador, mapa Leaflet/OSM, comparar redes) com fonte/validade.
- Propostas com página pública `/p/[id]`, impressão em PDF pelo navegador e link `wa.me`.
- Apólices, Renovações (janelas 90/60/30/15/7), Comissões previstas × recebidas, Tarefas.
- Documentos + Document AI (regex/heurística em documentos de texto) com confirmação humana.
- Data Import Center (CSV) e importador de rede com dedupe fuzzy.
- Motor de automações nativas com log e minutos economizados.
- Especializada AI determinística (sem LLM) com fontes.
- Configurações: perfis, auditoria (local), integrações (status DEMO).

**Limitações assumidas:** dados fictícios em `localStorage`; catálogo de seguradoras real, mas planos, preços, redes e cotações simulados; clientes e hospitais fictícios; sem autenticação real; nenhuma integração externa real; badge DEMO permanente.

**Aceite:** as 3 jornadas (SAÚDE, AUTO, EMPRESA) executáveis de ponta a ponta na DEMO.

---

## Fase 1 — Fundação: core operacional

- **Escopo (briefing):** Design System, Login, RBAC, Dashboard, Central de Operações, Clientes, Famílias, Empresas, CRM, Documentos, Tarefas.
- **Na prática:** Postgres + Prisma (schema deste repositório), Auth.js v5 + 2FA (admin/financeiro), RBAC server-side + restrição de carteira, auditoria append-only, storage S3 com URLs assinadas, busca global (pg_trgm/unaccent), Data Import Center para migrar a carteira atual, CEP (ViaCEP), apólices cadastradas manualmente/importadas para alimentar a Central.
- **Dependências:** D (carteira atual, lista real de seguradoras, baselines de tempo); A (ViaCEP); C (hospedagem, banco e storage com DPA, região Brasil).
- **Aceite:** carteira real importada com relatório; Central de Operações lista o trabalho do dia de cada usuário; jornada EMPRESA (cadastro → sócios → funcionários) com dados reais; revisão de segurança sem achados críticos.
- **Riscos:** qualidade da planilha legada (validação + revisão humana); adoção (treinar com a DEMO antes).

## Fase 2 — Saúde e rede credenciada

- **Escopo (briefing):** Saúde, Operadoras, Planos, Rede credenciada, Busca por endereço, Mapas, Comparador.
- **Na prática:** tabelas de preço por operadora/plano/faixa ANS com vigência; importador de rede (XLSX/CSV/PDF assistido) com dedupe (CNPJ/CNES + similaridade + geo), aliases, fonte e validade; dados abertos ANS como complemento (cobrem só hospitais, por registro de produto); geocodificação (Google/Mapbox) + PostGIS; comparador e recomendação.
- **Dependências:** D + C (tabelas de preço e rede das operadoras com quem a corretora trabalha); A (geocoding).
- **Aceite:** jornada SAÚDE até a comparação/rede com dados reais de ≥ 3 operadoras; 100% das consultas de rede exibem fonte e data de atualização.
- **Riscos:** operadoras não fornecerem tabelas em formato utilizável; defasagem da rede (validade visível + alertas de expiração).

## Fase 3 — Quote Engine, Auto e multicálculo

- **Escopo (briefing):** Quote Engine, Auto, multicálculo, propostas, comparador de cotações.
- **Na prática:** **integração própria** (decisão do cliente): um adapter por seguradora, começando pelas de maior volume, sobre a via que cada uma liberar; seguradoras sem integração entram como cotação manual; resultados normalizados com proveniência; FIPE via provedor; propostas com PDF server-side (Chromium) e página web; envio por `wa.me` até a Fase 5.
- **Dependências:** C + A (convênio e liberação de acesso técnico por seguradora); A (FIPE).
- **Aceite:** jornada AUTO completa com cálculo real em ≥ 4 seguradoras; seguradoras sem integração entram como "cotação manual" no mesmo comparativo.
- **Riscos:** seguradoras que não liberam API (mitigar: arquivo/importação ou manual); esforço de manutenção por seguradora (priorizar por volume; monitoramento e fallback automático para manual).

## Fase 4 — Apólices, renovações, comissões e automações

- **Escopo (briefing):** Apólices, renovações, comissões, automações.
- **Na prática:** emissão a partir de proposta aceita; renovação inteligente (90/60/30/15/7) com fila pg-boss; previsão × recebido de comissões e conciliação por extrato importado; construtor TRIGGER + CONDITION + ACTION com simulação; métrica de horas economizadas calibrada.
- **Dependências:** D (layouts de extrato por seguradora, regras de comissão/repasse).
- **Aceite:** 100% das apólices com renovação programada; ≥ 90% das linhas de extrato conciliadas automaticamente.
- **Riscos:** diversidade de layouts de extrato.

## Fase 5 — Especializada AI, Document AI, WhatsApp e e-mail

- **Escopo (briefing):** Especializada AI, Document AI, WhatsApp, e-mail.
- **Na prática:** tool-calling com Claude reaproveitando as ferramentas determinísticas da DEMO, guardrails (nenhum número sem fonte), avaliação contínua; Document AI com OCR/parse de PDF + LLM com saída estruturada e confiança por campo; WhatsApp Cloud API (templates, opt-in, webhook → histórico); caixa de entrada Gmail/Microsoft Graph.
- **Dependências:** A + C (LLM com DPA; Meta Business verificada ou BSP; e-mail corporativo); D (conjunto de avaliação com perguntas e documentos reais).
- **Aceite:** ≥ 95% de roteamento correto no conjunto de avaliação; 0 números não rastreáveis; documento recebido por WhatsApp/e-mail entra no Document AI e vira apólice após confirmação humana.
- **Riscos:** custo/latência; aprovação de templates; custo por mensagem.

## Fase 6 — Integrações avançadas

- **Escopo (briefing):** integrações avançadas, seguradoras, operadoras, APIs, automações adicionais.
- **Na prática:** APIs diretas de seguradoras estratégicas (cotação, emissão, segunda via); avaliação do Open Insurance (via SPOC) para dados de apólices com consentimento; orquestrações em lote ("renove todos os seguros que vencem em 30 dias"); portal do cliente; busca dedicada se necessário; multi-tenant com RLS.
- **Dependências:** C (parcerias, regulatório SUSEP), A.
- **Aceite:** apólice emitida chega sem digitação em ≥ 1 seguradora parceira.
- **Riscos:** prazos de parceiros; regulação do Open Insurance em revisão.

---

## Próximos passos imediatos

1. **Validar a DEMO com a equipe da corretora** (sessões por persona, roteiros das 3 jornadas; coletar fricções e lacunas).
2. **Levantar a lista real de seguradoras e operadoras** com quem trabalham, por ramo, e volume de cada uma.
3. **Integração própria**: listar as seguradoras por volume na carteira e iniciar o checklist de onboarding (convênio → acesso técnico → contrato de dados) com as 3 primeiras.
4. **Obter tabelas de rede e de preço** das operadoras prioritárias (formato, frequência de atualização, contato técnico).
5. **WhatsApp Cloud API (direto na Meta)**: número exclusivo, verificação do Meta Business, primeiros templates (renovação, proposta, documentos).
6. **Infraestrutura real**: provedor de Postgres (com PostGIS) e storage na região Brasil, Auth.js + 2FA, secrets manager.
7. **Cronometrar tarefas manuais** (1–2 semanas) para os baselines de horas economizadas.
8. **Jurídico/DPO**: nomear encarregado, validar bases legais (em especial dados de saúde), retenção e textos de consentimento.
9. **Decisões de negócio pendentes** listadas em [PRODUCT_SPEC §6(h)](PRODUCT_SPEC.md).
