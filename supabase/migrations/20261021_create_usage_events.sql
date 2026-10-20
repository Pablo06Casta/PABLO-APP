-- Analítica de uso anónima y agregada de CERCA.
-- El cliente solo puede insertar eventos con un nombre permitido y un
-- identificador público corto (sección, sede o función). No se guardan IP,
-- agente de usuario, identificadores de persona ni de sesión.

create table if not exists public.usage_events (
  id bigint generated always as identity primary key,
  event text not null
    check (event in ('section', 'destination', 'feature', 'tournament_plan')),
  detail text not null default ''
    check (char_length(detail) <= 64 and detail ~ '^[a-z0-9_-]*$'),
  created_at timestamptz not null default now()
);

create index if not exists usage_events_created_idx
  on public.usage_events (created_at);

alter table public.usage_events enable row level security;

-- Solo inserción desde la web. Sin política de lectura: los datos se consultan
-- desde el panel de Supabase con la cuenta del titular.
revoke all on public.usage_events from anon, authenticated;
grant insert (event, detail) on public.usage_events to anon, authenticated;

create policy "Anyone can record anonymous usage"
  on public.usage_events for insert
  to anon, authenticated
  with check (true);

-- Resumen diario para consultar desde el editor SQL:
--   select * from public.usage_summary order by day desc, total desc;
create or replace view public.usage_summary
  with (security_invoker = true) as
  select
    date_trunc('day', created_at)::date as day,
    event,
    detail,
    count(*) as total
  from public.usage_events
  group by 1, 2, 3;

revoke all on public.usage_summary from anon, authenticated;

-- Conservación: los eventos se eliminan a los 13 meses.
create extension if not exists pg_cron;
select cron.schedule(
  'cerca-usage-events-retention',
  '15 3 * * *',
  $$delete from public.usage_events where created_at < now() - interval '13 months'$$
);
