create table if not exists public.family_agenda (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null check (char_length(name) between 1 and 160),
  type text not null check (char_length(type) between 1 and 80),
  event_date date not null,
  note text not null default '' check (char_length(note) <= 4000),
  repeat_rule text not null default '',
  pawukon jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.family_agenda enable row level security;

drop policy if exists "Users can read their own family agenda" on public.family_agenda;
create policy "Users can read their own family agenda"
on public.family_agenda for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own family agenda" on public.family_agenda;
create policy "Users can insert their own family agenda"
on public.family_agenda for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own family agenda" on public.family_agenda;
create policy "Users can update their own family agenda"
on public.family_agenda for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own family agenda" on public.family_agenda;
create policy "Users can delete their own family agenda"
on public.family_agenda for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists family_agenda_user_date_idx
on public.family_agenda (user_id, event_date);
