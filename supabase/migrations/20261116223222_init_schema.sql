-- WorkBoard · initial schema
-- Hierarchy: board → list → task. Every row belongs to one user (owner_id),
-- and Row Level Security limits each user to their own data.

-- ─────────────────────────────────────────────
-- Schemas and helpers
-- ─────────────────────────────────────────────

-- Internal objects that must not be exposed through the Data API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Keeps updated_at current on every update.
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────
-- Types
-- ─────────────────────────────────────────────

-- The 10 colors of the user palette (design tokens palette-*).
create type public.palette_color as enum (
  'blue', 'teal', 'green', 'lime', 'amber',
  'orange', 'red', 'pink', 'violet', 'graphite'
);

-- List style: white or black.
create type public.list_style as enum ('light', 'dark');

-- ─────────────────────────────────────────────
-- Profiles
-- ─────────────────────────────────────────────

-- Public data of each account. The email stays in auth.users and is never copied here.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null check (char_length(btrim(full_name)) between 1 and 100),
  nickname    text not null unique check (nickname ~ '^[a-z0-9_.]{3,30}$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Public profile of each account: name and unique nickname (lowercase).';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- ─────────────────────────────────────────────
-- Boards
-- ─────────────────────────────────────────────

create table public.boards (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 100),
  description  text check (char_length(description) <= 2000),
  -- 'dots' (animated dot grid) or one of the palette colors.
  background   text not null default 'dots' check (background in (
                 'dots', 'blue', 'teal', 'green', 'lime', 'amber',
                 'orange', 'red', 'pink', 'violet', 'graphite'
               )),
  is_favorite  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on column public.boards.is_favorite is 'Only used for sorting: favorites come first.';

create index boards_owner_id_idx on public.boards (owner_id);

create trigger boards_set_updated_at
  before update on public.boards
  for each row execute function private.set_updated_at();

-- ─────────────────────────────────────────────
-- Lists
-- ─────────────────────────────────────────────

create table public.board_lists (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid not null references public.boards (id) on delete cascade,
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 100),
  style       public.list_style not null default 'light',
  -- Fractional position: moving a list only rewrites that list.
  position    double precision not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index board_lists_board_id_position_idx on public.board_lists (board_id, position);
create index board_lists_owner_id_idx on public.board_lists (owner_id);

create trigger board_lists_set_updated_at
  before update on public.board_lists
  for each row execute function private.set_updated_at();

-- ─────────────────────────────────────────────
-- Tasks
-- ─────────────────────────────────────────────

create table public.board_tasks (
  id           uuid primary key default gen_random_uuid(),
  list_id      uuid not null references public.board_lists (id) on delete cascade,
  owner_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 500),
  description  text check (char_length(description) <= 10000),
  -- null = no color.
  color        public.palette_color,
  position     double precision not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index board_tasks_list_id_position_idx on public.board_tasks (list_id, position);
create index board_tasks_owner_id_idx on public.board_tasks (owner_id);

create trigger board_tasks_set_updated_at
  before update on public.board_tasks
  for each row execute function private.set_updated_at();

-- ─────────────────────────────────────────────
-- Board summaries ("4 listas · 23 tareas")
-- ─────────────────────────────────────────────

-- security_invoker: the view runs with the caller's permissions, so RLS applies.
create view public.board_summaries
with (security_invoker = true)
as
select
  b.id as board_id,
  (select count(*) from public.board_lists l where l.board_id = b.id) as list_count,
  (select count(*)
     from public.board_tasks t
     join public.board_lists l on l.id = t.list_id
    where l.board_id = b.id) as task_count
from public.boards b;

-- ─────────────────────────────────────────────
-- Data API privileges
-- ─────────────────────────────────────────────

-- Only signed-in users reach these tables; anonymous clients get nothing.
revoke all on public.profiles, public.boards, public.board_lists, public.board_tasks,
  public.board_summaries from anon, authenticated;

-- Profiles are created by the sign-up trigger and deleted with the account.
grant select on public.profiles to authenticated;
grant update (full_name, nickname) on public.profiles to authenticated;

grant select, insert, update, delete on public.boards, public.board_lists, public.board_tasks
  to authenticated;

grant select on public.board_summaries to authenticated;

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.boards enable row level security;
alter table public.board_lists enable row level security;
alter table public.board_tasks enable row level security;

-- Profiles: each user sees and edits only their own.
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Boards
create policy "Users can read their own boards"
  on public.boards for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Users can create their own boards"
  on public.boards for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Users can update their own boards"
  on public.boards for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Users can delete their own boards"
  on public.boards for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

-- Lists: besides owning the list, the parent board must be theirs.
create policy "Users can read their own lists"
  on public.board_lists for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Users can create lists in their own boards"
  on public.board_lists for insert
  to authenticated
  with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.boards b
      where b.id = board_id and b.owner_id = (select auth.uid())
    )
  );

create policy "Users can update their own lists"
  on public.board_lists for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.boards b
      where b.id = board_id and b.owner_id = (select auth.uid())
    )
  );

create policy "Users can delete their own lists"
  on public.board_lists for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

-- Tasks: besides owning the task, the parent list must be theirs.
create policy "Users can read their own tasks"
  on public.board_tasks for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Users can create tasks in their own lists"
  on public.board_tasks for insert
  to authenticated
  with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.board_lists l
      where l.id = list_id and l.owner_id = (select auth.uid())
    )
  );

create policy "Users can update their own tasks"
  on public.board_tasks for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.board_lists l
      where l.id = list_id and l.owner_id = (select auth.uid())
    )
  );

create policy "Users can delete their own tasks"
  on public.board_tasks for delete
  to authenticated
  using ((select auth.uid()) = owner_id);
