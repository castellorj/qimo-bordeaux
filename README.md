# QIMO · Bordeaux Experience

Concierge digital de luxo para o cruzeiro fluvial da QIMO em Bordeaux
(**SS Bon Voyage · 25 out — 1 nov 2026**).

Design editorial premium (azul petróleo · off-white · dourado discreto),
PWA instalável, offline, mobile-first. Stack: **Next.js 15 (App Router) ·
React 19 · TypeScript · Tailwind CSS · Supabase (opcional)**.

## Rodar localmente

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm run start   # produção
```

O guia funciona **100% sem backend** — usa o conteúdo curado em `src/content`.

## Estrutura

```
src/
  app/                 páginas (App Router)
    page.tsx           Home (hero, contagem regressiva, clima, próxima atividade)
    programacao/       Timeline completa da viagem (dados reais)
    cidades/           Lista + [slug] editorial
    vinicolas/         Lista + [slug] (terroir, castas, pontuações, o que provar)
    vinhos/            Biblioteca de apelações + [slug]
    experiencias/  gastronomia/  compras/
    concierge/         Contatos, câmbio ao vivo, frases em francês
    informacoes/       Clima ao vivo, etiqueta, essenciais
    documentos/        Cofre offline (localStorage, só no aparelho)
    favoritos/  mapa/  offline/  admin/
  content/             Conteúdo curado (fonte da verdade) + índice de busca
  components/           UI, providers (tema/favoritos), SmartImage, chrome, PWA
  lib/                 tipos, navegação, formatação, Supabase, resolvedores
public/
  manifest.webmanifest · sw.js (offline) · icon.svg
supabase/
  migrations/0001_init.sql · seed.sql
```

## Recursos

- **PWA instalável** + service worker (páginas visitadas funcionam offline).
- **Tema claro/escuro**, busca global, favoritos offline (localStorage).
- **Clima ao vivo** (Open-Meteo, sem chave) e **câmbio ao vivo** (Frankfurter).
- **Contagem regressiva** para o embarque; **próxima experiência** automática.
- **Selo "Seleção QIMO"** destacando a curadoria.
- Só **fotografias reais** — enquanto a foto oficial não é inserida, um
  placeholder de marca é exibido (nunca imagens de IA).

## Fotografias

Substitua os placeholders preenchendo o campo `heroImage`/`gallery` de cada item
em `src/content/*` com URLs de fotos reais (sites oficiais, turismo oficial,
Unsplash/Pexels/Adobe Stock licenciados). Domínios liberados em `next.config.mjs`.

## Supabase & painel admin (opcional)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Rode `supabase/migrations/0001_init.sql` e `supabase/seed.sql`.
3. Copie URL + anon key para `.env.local` (veja `.env.local.example`).
4. `/admin` passa a refletir a conexão. A edição em tempo real é o próximo passo.

## Variáveis de ambiente

Veja `.env.local.example`. Todas são opcionais para rodar. Configure
`NEXT_PUBLIC_QIMO_WHATSAPP` e `NEXT_PUBLIC_QIMO_PHONE` para os botões do concierge.
