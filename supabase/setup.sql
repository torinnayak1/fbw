-- Run this once in the Supabase SQL editor so the app can live-update.
-- Writes still go through the Next.js API with the secret key.

alter table public.picks replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.picks;
  exception
    when duplicate_object then null;
  end;
end $$;

alter table public.picks enable row level security;

drop policy if exists "Anyone can read picks" on public.picks;
create policy "Anyone can read picks"
  on public.picks
  for select
  using (true);
