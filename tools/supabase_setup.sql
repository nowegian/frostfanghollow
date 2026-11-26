-- Frostfang Hollow Link: shared progressive jackpots for the public website
-- Paste this whole script into Supabase > SQL Editor > New query, then press Run.

-- One row holds the shared meters for everyone
create table if not exists public.jackpots (
  id          int primary key default 1 check (id = 1),
  grand_acc   numeric not null default 0,  -- dollars added to the GRAND above its $9,000 start
  major_acc   numeric not null default 0,  -- growth added to the MAJOR (scaled by each player's bet)
  grand_round int not null default 0,      -- goes up by 1 each time someone wins the GRAND
  major_round int not null default 0,      -- goes up by 1 each time someone wins the MAJOR
  updated_at  timestamptz not null default now()
);
insert into public.jackpots (id) values (1) on conflict (id) do nothing;

-- Anyone can read the meters; nobody can edit the table directly
alter table public.jackpots enable row level security;
drop policy if exists "anyone can read the jackpots" on public.jackpots;
create policy "anyone can read the jackpots" on public.jackpots for select using (true);
grant select on public.jackpots to anon, authenticated;

-- Spins feed the meters. Each call is capped at about 20 spins' worth at the biggest bet,
-- so nobody can push a meter up by a large amount in one go.
create or replace function public.jp_add(g numeric, m numeric)
returns public.jackpots
language plpgsql security definer set search_path = public as $$
declare r public.jackpots;
begin
  update public.jackpots set
    grand_acc  = grand_acc + least(greatest(coalesce(g, 0), 0), 2),
    major_acc  = major_acc + least(greatest(coalesce(m, 0), 0), 0.12),
    updated_at = now()
  where id = 1
  returning * into r;
  return r;
end $$;

-- A win resets that meter for everyone. If two players win in the same moment,
-- only the first reset counts (the round number has to match).
create or replace function public.jp_win(which text, round int)
returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if which = 'GRAND' then
    update public.jackpots set grand_acc = 0, grand_round = grand_round + 1, updated_at = now()
     where id = 1 and grand_round = round;
  elsif which = 'MAJOR' then
    update public.jackpots set major_acc = 0, major_round = major_round + 1, updated_at = now()
     where id = 1 and major_round = round;
  else
    return false;
  end if;
  get diagnostics n = row_count;
  return n = 1;
end $$;

revoke all on function public.jp_add(numeric, numeric) from public;
revoke all on function public.jp_win(text, int) from public;
grant execute on function public.jp_add(numeric, numeric) to anon, authenticated;
grant execute on function public.jp_win(text, int) to anon, authenticated;
