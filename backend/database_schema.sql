-- ============================================================
-- AI Startup Launch Team — Supabase PostgreSQL Schema
-- ============================================================
-- Adapted from the PRD's reference DDL, with field names/enums aligned to
-- the actual backend Pydantic schemas (app/models/schemas.py,
-- app/models/agent_output_schemas.py) so real API payloads map onto these
-- columns without translation, plus the additions this task specifically
-- asked for: a `validation_status` (Green/Amber/Red) column on the session
-- table, and an explicit `orchestrator_summary` shape captured inside
-- agent_runs. Run this whole file once in the Supabase SQL Editor.
--
-- Design notes:
--   * Single-user portal: RLS policies scope every row to auth.uid(), which
--     is correct and secure whether the project ever has one user or many —
--     "single-user" here means no cross-user sharing, not skipping RLS.
--   * All variable-shape agent data is stored as JSONB (input_payload /
--     output_payload / *_jsonb columns) rather than being pre-modeled into
--     rigid columns — this matches how the FastAPI layer treats it: each
--     sub-agent's own strict Pydantic schema is the source of truth for
--     shape, Postgres just needs to store and index it.
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ============================================================
-- PROFILES (extends auth.users — one row per Supabase Auth user)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  -- Single-user-portal settings (theme, default country/segment, etc.) —
  -- kept as JSONB so the frontend can evolve its settings shape freely.
  portal_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new Supabase Auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- WORKSPACES (Startup Sessions / Runs — one per startup-idea validation run)
-- ============================================================
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled Idea',

  -- Pipeline lifecycle state machine, matching app/services/run_state.py
  -- exactly: draft (wizard not yet submitted) -> pending_validation ->
  -- running -> compiled -> delivered, with `failed` as the terminal error state.
  status text not null default 'draft'
    check (status in ('draft', 'pending_validation', 'running',
                       'compiled', 'delivered', 'failed')),

  -- Final synthesis verdict from the Chief AI Orchestrator
  -- (OrchestratorOutput.validation_status) — null until a run compiles.
  validation_status text
    check (validation_status is null or validation_status in ('Green', 'Amber', 'Red')),

  -- $20-per-run monetization gate (PRD §3: Stripe webhook unlocks the workspace).
  is_unlocked boolean not null default false,
  stripe_payment_intent_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- ONBOARDING_INPUTS (full wizard submission, one row per workspace)
-- Column names mirror app.models.schemas.OrchestratorInput exactly.
-- ============================================================
create table if not exists public.onboarding_inputs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,

  -- Market Research (Agent 1) wizard fields
  core_idea text,
  target_industry text,
  target_location text,
  country_code text,                 -- ISO-3166 alpha-2, e.g. 'pk'
  audience_demographics jsonb,        -- {age_range, income_band, segment}
  known_competitors jsonb,            -- string[]

  -- Product Strategist (Agent 2) wizard fields
  core_feature text,
  delivery_mechanism text
    check (delivery_mechanism is null or delivery_mechanism in ('Web', 'Mobile', 'API', 'Hybrid')),
  visual_vibe jsonb,                  -- {style, mode, color_palette: {primary,secondary,accent,background}}

  -- Pricing (Agent 3) wizard fields
  tech_stack_expectations text,
  target_customer_segment text
    check (target_customer_segment is null
           or target_customer_segment in ('B2C', 'SMB', 'Mid-Market', 'Enterprise')),
  customer_acquisition_cost numeric,
  minimum_profit_expectation numeric,

  -- Marketing (Agent 4) wizard fields
  tone_of_voice text
    check (tone_of_voice is null or tone_of_voice in ('Professional', 'Playful', 'Bold', 'Minimal')),
  marketing_budget_min_usd numeric,
  marketing_budget_max_usd numeric,
  launch_timeline text,               -- free text/duration, e.g. "6 weeks from today"

  updated_at timestamptz not null default now(),
  unique (workspace_id)
);

-- ============================================================
-- AGENT_RUNS (Sub-Agent Outputs — append-only log, one row per execution)
-- Covers all 4 sub-agents AND the orchestrator's own compiled synthesis,
-- distinguished by agent_name. output_payload holds that agent's exact
-- validated JSON:
--   market_research      -> MarketResearchOutput
--   product_strategist    -> ProductStrategyOutput
--   pricing                -> PricingOutput
--   marketing               -> MarketingOutput
--   orchestrator             -> OrchestratorOutput (executive_summary,
--                              validation_status, validation_reasoning,
--                              low_information_warning, failure_case_study,
--                              compiled_dashboard, verified_resources)
-- Append-only so retries/re-routing (PRD §3.6 counter-questioning) keep full
-- history instead of overwriting a previous attempt.
-- ============================================================
create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_name text not null
    check (agent_name in ('orchestrator', 'market_research',
                           'product_strategist', 'pricing', 'marketing')),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed', 'degraded')),
  input_payload jsonb,
  output_payload jsonb,
  error_message text,
  retry_count integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RESOURCE_LINKS (verified_resources surfaced by Market Research / Orchestrator)
-- Mirrors app.models.agent_output_schemas.VerifiedResource: {url, source_agent, description}.
-- ============================================================
create table if not exists public.resource_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  url text not null,
  source_agent text not null,
  description text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- updated_at maintenance trigger (applied to every table with the column)
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.workspaces;
create trigger set_updated_at before update on public.workspaces
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.onboarding_inputs;
create trigger set_updated_at before update on public.onboarding_inputs
  for each row execute function public.set_updated_at();

-- ============================================================
-- INDEXES — run IDs (workspace_id) and user IDs (owner_id), plus the
-- columns the dashboard/list views filter on most.
-- ============================================================
create index if not exists idx_workspaces_owner on public.workspaces(owner_id);
create index if not exists idx_workspaces_status on public.workspaces(status);

create index if not exists idx_onboarding_inputs_workspace on public.onboarding_inputs(workspace_id);

create index if not exists idx_agent_runs_workspace on public.agent_runs(workspace_id);
create index if not exists idx_agent_runs_workspace_agent on public.agent_runs(workspace_id, agent_name);
create index if not exists idx_agent_runs_status on public.agent_runs(status);

create index if not exists idx_resource_links_workspace on public.resource_links(workspace_id);

-- ============================================================
-- ROW LEVEL SECURITY — single-authenticated-user access: every row is
-- reachable only through a workspace owned by auth.uid().
-- ============================================================
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.onboarding_inputs enable row level security;
alter table public.agent_runs enable row level security;
alter table public.resource_links enable row level security;

-- profiles: a user can only see/edit their own profile row.
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- workspaces: full CRUD, but only on rows the user owns.
drop policy if exists "Owners can manage their workspaces" on public.workspaces;
create policy "Owners can manage their workspaces"
  on public.workspaces for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- onboarding_inputs: full CRUD via workspace ownership (the wizard writes
-- and re-writes this row as the founder fills it in).
drop policy if exists "Owners can manage their onboarding inputs" on public.onboarding_inputs;
create policy "Owners can manage their onboarding inputs"
  on public.onboarding_inputs for all
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

-- agent_runs: read-only from the client — the backend (using the
-- service_role key, which bypasses RLS entirely) is the only writer.
drop policy if exists "Owners can read their agent runs" on public.agent_runs;
create policy "Owners can read their agent runs"
  on public.agent_runs for select
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

-- resource_links: read-only from the client, same rationale as agent_runs.
drop policy if exists "Owners can read their resource links" on public.resource_links;
create policy "Owners can read their resource links"
  on public.resource_links for select
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));
