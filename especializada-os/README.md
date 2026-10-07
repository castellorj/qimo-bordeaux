# Especializada Seguros OS — Insurance Operating System (DEMO)

> **Eliminar trabalho operacional, e não apenas digitalizá-lo.**

Sistema operacional da corretora Especializada Seguros: clientes, famílias, empresas, ativos, CRM,
cotação (Quote Engine + multicálculo), rede credenciada com mapa, propostas, apólices, renovação
inteligente, comissões, documentos + Document AI, automações e Especializada AI.

Esta é a **versão DEMO navegável** (Fase 0): todos os dados são **fictícios** e marcados como DEMO —
inclusive nomes de seguradoras, operadoras e hospitais, para nunca atribuir preços ou redes
inventados a marcas reais. Os dados ficam só no navegador (localStorage).

## Rodar

```bash
cd especializada-os
npm install
npm run dev        # http://localhost:3100
npm test           # testes do domínio (motores de prioridade, saúde, automações, IA, importação…)
npm run build && npm start
```

Na tela de login, escolha um perfil (Administrador, Gestor, Corretor, Operacional, Financeiro) —
cada um vê o sistema com as permissões do seu papel. "Restaurar dados DEMO" fica no menu do usuário.

## Roteiro sugerido para validar com a equipe

1. **Central de Operações** — o que fazer hoje, priorizado automaticamente.
2. **Clientes → João Silva** — Cliente 360º, mapa de relações, oportunidades.
3. **Famílias → Família Pereira → "Cotar saúde da família"** — hospitais desejados, recomendação,
   comparador, "O que muda?", proposta, página pública (/p/…), aceite, emissão → renovação programada.
4. **Renovações → João Silva (Auto, 7 dias)** — "Nova cotação" → multicálculo (6 seguradoras,
   uma só manual) → proposta → emissão; a apólice anterior vira "Renovada".
5. **Rede Credenciada** — por endereço (raio no mapa), por plano, por hospital, comparar redes,
   importador com detecção de duplicados ("Atlantico Dor" = "Hospital Atlântico D'Or").
6. **Documentos → revisar documento do Felipe** — Document AI com confiança por campo e
   confirmação humana obrigatória para campos críticos.
7. **Especializada AI** — perguntas sobre a carteira, sempre com a fonte do dado.
8. **Importação** — planilha de exemplo com duplicados, CPF inválido e conflitos.
9. Entre como **Rafael (corretor)** para ver a restrição de carteira.

## Documentação (planejamento)

| Documento | Conteúdo |
|---|---|
| [PRODUCT_SPEC](docs/PRODUCT_SPEC.md) | visão, personas, funcionalidades, análise do briefing e decisões de negócio pendentes |
| [USER_FLOWS](docs/USER_FLOWS.md) | fluxos e roteiros de aceite (Saúde, Auto, Empresa) |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | arquitetura da DEMO e da produção (ADRs) |
| [DATABASE_SCHEMA](docs/DATABASE_SCHEMA.md) + [schema.prisma](prisma/schema.prisma) | modelagem completa (Postgres) |
| [INTEGRATIONS](docs/INTEGRATIONS.md) | adapters e pesquisa das integrações oficiais existentes |
| [INSURER_INTEGRATION_GUIDE](docs/INSURER_INTEGRATION_GUIDE.md) | como integrar cada seguradora: ondas, kit, modelo de pedido, checklist técnico |
| [SECURITY_LGPD](docs/SECURITY_LGPD.md) | LGPD e controles de segurança |
| [DESIGN_SYSTEM](docs/DESIGN_SYSTEM.md) | tokens, componentes, padrões |
| [AUTOMATIONS](docs/AUTOMATIONS.md) | Automation Engine (trigger + condition + action) |
| [AI_ARCHITECTURE](docs/AI_ARCHITECTURE.md) | Especializada AI e Document AI |
| [ROADMAP](docs/ROADMAP.md) | Fase 0 (DEMO) + Fases 1–6 |

## Estrutura

```
src/
  domain/            modelo (types.ts), registro de ramos (products.ts), RBAC e motores puros:
    engines/         priority (Central), health (preço/rede/recomendação), automation, crosssell,
                     assistant (Especializada AI), search, importer, compare, metrics, queries
  data/              seed DEMO, casos de uso (actions*.ts) e store (repositório local da DEMO)
  integrations/      insurers/ (adapters + calculadora simulada), health-networks/, maps/,
                     whatsapp/, email/, ai/, storage/, document-parsing/
  components/        UI (design system), shell, mapa, telas compartilhadas
  app/               rotas (Next.js App Router)
```

As regras de negócio vivem em `src/domain` e `src/data/actions*.ts` como funções puras: na produção
elas passam a rodar no servidor sobre Postgres sem reescrever a lógica (ver ARCHITECTURE.md).
