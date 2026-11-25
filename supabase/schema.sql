-- README.me database schema
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

-- ─────────────────────────────────────────────────────────────
-- Profiles: one row per team member, created automatically on
-- their first Discord sign-in.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  discord_id    text,
  username      text,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  completed_at  timestamptz
);

-- ─────────────────────────────────────────────────────────────
-- Responses: one row per member per question. `value` holds the
-- answer as JSON (text, choice, choices, scale, fields, skipped…).
-- ─────────────────────────────────────────────────────────────
create table if not exists public.responses (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  question_id  text not null,
  value        jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now(),
  primary key (user_id, question_id)
);

-- ─────────────────────────────────────────────────────────────
-- Admins: people allowed to read everyone's answers (you).
-- Add yourself after your first sign-in — see README.md.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ─────────────────────────────────────────────────────────────
-- Create a profile automatically when someone signs in with Discord.
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, discord_id, username, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'provider_id',
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'user_name'),
    coalesce(
      new.raw_user_meta_data -> 'custom_claims' ->> 'global_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
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

-- ─────────────────────────────────────────────────────────────
-- Row Level Security: members see only their own data,
-- admins can read everything. Nobody can read the admins table
-- except through is_admin().
-- ─────────────────────────────────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.responses enable row level security;
alter table public.admins    enable row level security;

drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "responses: read own or admin" on public.responses;
create policy "responses: read own or admin" on public.responses
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "responses: insert own" on public.responses;
create policy "responses: insert own" on public.responses
  for insert with check (user_id = auth.uid());

drop policy if exists "responses: update own" on public.responses;
create policy "responses: update own" on public.responses
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "responses: delete own" on public.responses;
create policy "responses: delete own" on public.responses
  for delete using (user_id = auth.uid());

-- Only existing admins can add admins (policies below), so nobody can make
-- themselves an admin. The very first admin is added from the SQL editor.

-- ─────────────────────────────────────────────────────────────
-- Forms: the questionnaire itself, editable from the admin panel.
-- `form_published` is what members see (anyone can read it).
-- `form_drafts` is the admin's work in progress (admins only).
-- When no published form exists yet, the app uses its built-in
-- "Team deep-dive" template.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.form_published (
  id            text primary key default 'main',
  doc           jsonb not null,
  published_at  timestamptz not null default now(),
  published_by  uuid references auth.users (id)
);

create table if not exists public.form_drafts (
  id          text primary key default 'main',
  doc         jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table public.form_published enable row level security;
alter table public.form_drafts    enable row level security;

drop policy if exists "form_published: read all" on public.form_published;
create policy "form_published: read all" on public.form_published
  for select using (true);

drop policy if exists "form_published: admin write" on public.form_published;
create policy "form_published: admin write" on public.form_published
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "form_drafts: admin only" on public.form_drafts;
create policy "form_drafts: admin only" on public.form_drafts
  for all using (public.is_admin()) with check (public.is_admin());

-- Admins can see and manage the admin list from the dashboard
-- (but can't remove themselves, so there's always at least one).
drop policy if exists "admins: admin read" on public.admins;
create policy "admins: admin read" on public.admins
  for select using (public.is_admin());

drop policy if exists "admins: admin add" on public.admins;
create policy "admins: admin add" on public.admins
  for insert with check (public.is_admin());

drop policy if exists "admins: admin remove others" on public.admins;
create policy "admins: admin remove others" on public.admins
  for delete using (public.is_admin() and user_id <> auth.uid());
