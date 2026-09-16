-- Human-in-the-loop chat sessions (ChatGPT-style validation flow).
-- Idempotent: safe to run more than once in the Supabase SQL Editor.
-- Depends on public.set_updated_at() from database_schema.sql.

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New validation',
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  current_agent_index smallint not null default 0 check (current_agent_index between 0 and 5),
  intake jsonb not null default '{}'::jsonb,
  approved_outputs jsonb not null default '{}'::jsonb,
  report jsonb,
  share_id uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  agent_id text not null check (agent_id in ('market_research', 'product_strategist', 'financial', 'marketing', 'orchestrator')),
  sender text not null check (sender in ('agent', 'user', 'system')),
  content text not null default '',
  options jsonb,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chats_user_updated_idx on public.chats (user_id, updated_at desc);
create index if not exists messages_chat_created_idx on public.messages (chat_id, created_at);

drop trigger if exists chats_set_updated_at on public.chats;
create trigger chats_set_updated_at before update on public.chats
  for each row execute function public.set_updated_at();

alter table public.chats enable row level security;
alter table public.messages enable row level security;

drop policy if exists "chats_owner_all" on public.chats;
create policy "chats_owner_all" on public.chats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "messages_owner_all" on public.messages;
create policy "messages_owner_all" on public.messages
  for all
  using (exists (select 1 from public.chats c where c.id = chat_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.chats c where c.id = chat_id and c.user_id = auth.uid()));

-- Public read-only share: exposes only a completed chat's title + report,
-- looked up by its unguessable share_id (never the chat id or the owner).
create or replace function public.get_shared_report(p_share_id uuid)
returns table (title text, report jsonb, completed_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select c.title, c.report, c.updated_at
  from public.chats c
  where c.share_id = p_share_id and c.status = 'completed' and c.report is not null
$$;

revoke all on function public.get_shared_report(uuid) from public;
grant execute on function public.get_shared_report(uuid) to anon, authenticated;
