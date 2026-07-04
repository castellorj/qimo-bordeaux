-- QIMO Bordeaux Experience — seed inicial
-- O conteúdo curado completo vive em src/content (fonte da verdade da v1).
-- Este seed registra a viagem; o painel admin poderá sincronizar o restante.

insert into viagens (slug, titulo, navio, data_inicio, data_fim)
values ('qimo-bordeaux-2026', 'Bordeaux Experience', 'SS Bon Voyage', '2026-10-25', '2026-11-01')
on conflict (slug) do update
  set titulo = excluded.titulo,
      navio = excluded.navio,
      data_inicio = excluded.data_inicio,
      data_fim = excluded.data_fim;

-- Para popular dias, cidades, vinícolas, vinhos, experiências, gastronomia e
-- compras a partir do conteúdo curado, use a rotina de sincronização do painel
-- administrativo (a ser habilitada quando o Supabase estiver conectado), que lê
-- src/content e faz upsert nas tabelas correspondentes.
