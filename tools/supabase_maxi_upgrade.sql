-- Frostfang Hollow Link: upgrade the shared jackpots for the MAXI (run once)
-- Paste this whole script into Supabase > SQL Editor > New query, then press Run.
-- It adds the MAXI meter, switches the MAJOR meter to dollars (it starts again from its $6,000 seed),
-- and adds jp_add3 for the three progressives. The old jp_add keeps working.

alter table public.jackpots add column if not exists maxi_acc   numeric not null default 0;
alter table public.jackpots add column if not exists maxi_round int     not null default 0;
update public.jackpots set major_acc = 0, major_round = major_round + 1, updated_at = now() where id = 1;

-- Spins feed the meters (dollars). Each call is capped at about 20 spins' worth at the biggest bet ($12.50).
create or replace function public.jp_add3(g numeric, j numeric, x numeric)
returns public.jackpots
language plpgsql security definer set search_path = public as $$
declare r public.jackpots;
begin
  update public.jackpots set
    grand_acc  = grand_acc + least(greatest(coalesce(g, 0), 0), 1),
    major_acc  = major_acc + least(greatest(coalesce(j, 0), 0), 1),
    maxi_acc   = maxi_acc  + least(greatest(coalesce(x, 0), 0), 1.5),
    updated_at = now()
  where id = 1
  returning * into r;
  return r;
end $$;

-- A win resets that meter for everyone. If two players win in the same moment, only the first reset counts.
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
  elsif which = 'MAXI' then
    update public.jackpots set maxi_acc = 0, maxi_round = maxi_round + 1, updated_at = now()
     where id = 1 and maxi_round = round;
  else
    return false;
  end if;
  get diagnostics n = row_count;
  return n = 1;
end $$;

revoke all on function public.jp_add3(numeric, numeric, numeric) from public;
grant execute on function public.jp_add3(numeric, numeric, numeric) to anon, authenticated;
