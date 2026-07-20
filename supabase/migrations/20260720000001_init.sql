-- ============================================================
-- Collectif Junior France – Curling · Schéma initial
-- À exécuter dans l'éditeur SQL Supabase (ou `supabase db push`)
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Entraîneurs (profils liés à auth.users)
-- ------------------------------------------------------------
create table public.coaches (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  first_name  text,
  last_name   text,
  role        text not null default 'coach' check (role in ('admin', 'coach')),
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Saisons
-- ------------------------------------------------------------
create table public.seasons (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  start_date  date not null,
  end_date    date,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Joueurs
-- ------------------------------------------------------------
create table public.players (
  id             uuid primary key default gen_random_uuid(),
  first_name     text not null,
  last_name      text not null,
  birth_date     date,
  sex            text check (sex in ('M', 'F')),
  category       text,
  dominant_hand  text check (dominant_hand in ('droite', 'gauche', 'ambidextre')),
  photo_url      text,
  joined_at      date,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Entraînements
-- ------------------------------------------------------------
create table public.trainings (
  id          uuid primary key default gen_random_uuid(),
  season_id   uuid references public.seasons (id) on delete set null,
  date        date not null,
  location    text,
  comments    text,
  created_by  uuid references public.coaches (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index trainings_season_idx on public.trainings (season_id);
create index trainings_date_idx on public.trainings (date);

-- ------------------------------------------------------------
-- Présences
-- ------------------------------------------------------------
create table public.attendance (
  id           uuid primary key default gen_random_uuid(),
  training_id  uuid not null references public.trainings (id) on delete cascade,
  player_id    uuid not null references public.players (id) on delete cascade,
  status       text not null check (status in ('present', 'absent', 'excused')),
  unique (training_id, player_id)
);
create index attendance_player_idx on public.attendance (player_id);

-- ------------------------------------------------------------
-- Notes d'entraînement
--   performance /10 · attitude, sérieux, implication /5
-- ------------------------------------------------------------
create table public.training_scores (
  id           uuid primary key default gen_random_uuid(),
  training_id  uuid not null references public.trainings (id) on delete cascade,
  player_id    uuid not null references public.players (id) on delete cascade,
  performance  numeric(3, 1) check (performance between 0 and 10),
  attitude     numeric(2, 1) check (attitude between 0 and 5),
  seriousness  numeric(2, 1) check (seriousness between 0 and 5),
  involvement  numeric(2, 1) check (involvement between 0 and 5),
  comments     text,
  unique (training_id, player_id)
);
create index training_scores_player_idx on public.training_scores (player_id);

-- ------------------------------------------------------------
-- Matchs d'entraînement (vainqueur déduit du score)
-- ------------------------------------------------------------
create table public.matches (
  id           uuid primary key default gen_random_uuid(),
  season_id    uuid references public.seasons (id) on delete set null,
  date         date not null,
  category     text not null default 'mixte' check (category in ('hommes', 'femmes', 'mixte')),
  team_a_name  text not null default 'Équipe A',
  team_b_name  text not null default 'Équipe B',
  score_a      integer not null default 0 check (score_a >= 0),
  score_b      integer not null default 0 check (score_b >= 0),
  comments     text,
  created_at   timestamptz not null default now()
);
create index matches_season_idx on public.matches (season_id);

create table public.match_players (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches (id) on delete cascade,
  player_id  uuid not null references public.players (id) on delete cascade,
  team       text not null check (team in ('A', 'B')),
  unique (match_id, player_id)
);
create index match_players_player_idx on public.match_players (player_id);

-- ------------------------------------------------------------
-- Paramètres (ligne unique id = 1)
-- ------------------------------------------------------------
create table public.settings (
  id           integer primary key check (id = 1),
  weights      jsonb not null default '{"performance": 30, "matches": 25, "attendance": 20, "attitude": 10, "seriousness": 10, "involvement": 5}',
  win_points   integer not null default 2 check (win_points >= 0),
  loss_points  integer not null default 1 check (loss_points >= 0),
  categories   jsonb not null default '["U15", "U18", "U21"]',
  updated_at   timestamptz not null default now()
);

insert into public.settings (id) values (1);

create or replace function public.touch_settings()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_settings();

-- ------------------------------------------------------------
-- Création automatique du profil entraîneur à l'inscription.
-- Le tout premier compte devient administrateur.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.coaches (id, email, first_name, last_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    case when not exists (select 1 from public.coaches) then 'admin' else 'coach' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Helper rôle (security definer pour éviter la récursion RLS)
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.coaches
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- Row Level Security
--   Lecture : tous les entraîneurs authentifiés.
--   Écriture métier (entraînements, présences, notes, matchs) : entraîneurs.
--   Suppressions structurantes + joueurs/paramètres/saisons/rôles : admin.
-- ------------------------------------------------------------
alter table public.coaches         enable row level security;
alter table public.seasons         enable row level security;
alter table public.players         enable row level security;
alter table public.trainings       enable row level security;
alter table public.attendance      enable row level security;
alter table public.training_scores enable row level security;
alter table public.matches         enable row level security;
alter table public.match_players   enable row level security;
alter table public.settings        enable row level security;

-- Coaches : chacun se lit ; l'admin gère les rôles.
create policy "coaches_select" on public.coaches
  for select to authenticated using (true);
create policy "coaches_update_admin" on public.coaches
  for update to authenticated using (public.is_admin());
create policy "coaches_delete_admin" on public.coaches
  for delete to authenticated using (public.is_admin());

-- Saisons : lecture pour tous, écriture admin.
create policy "seasons_select" on public.seasons
  for select to authenticated using (true);
create policy "seasons_write_admin" on public.seasons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Joueurs : lecture + création/édition par les entraîneurs, suppression admin.
create policy "players_select" on public.players
  for select to authenticated using (true);
create policy "players_insert" on public.players
  for insert to authenticated with check (true);
create policy "players_update" on public.players
  for update to authenticated using (true);
create policy "players_delete_admin" on public.players
  for delete to authenticated using (public.is_admin());

-- Entraînements : gestion par les entraîneurs, suppression admin.
create policy "trainings_select" on public.trainings
  for select to authenticated using (true);
create policy "trainings_insert" on public.trainings
  for insert to authenticated with check (true);
create policy "trainings_update" on public.trainings
  for update to authenticated using (true);
create policy "trainings_delete_admin" on public.trainings
  for delete to authenticated using (public.is_admin());

-- Présences & notes : réécriture complète par les entraîneurs
-- (l'éditeur d'entraînement supprime puis réinsère).
create policy "attendance_all" on public.attendance
  for all to authenticated using (true) with check (true);
create policy "training_scores_all" on public.training_scores
  for all to authenticated using (true) with check (true);

-- Matchs : création/édition par les entraîneurs, suppression admin.
create policy "matches_select" on public.matches
  for select to authenticated using (true);
create policy "matches_insert" on public.matches
  for insert to authenticated with check (true);
create policy "matches_update" on public.matches
  for update to authenticated using (true);
create policy "matches_delete_admin" on public.matches
  for delete to authenticated using (public.is_admin());

create policy "match_players_all" on public.match_players
  for all to authenticated using (true) with check (true);

-- Paramètres : lecture pour tous, écriture admin.
create policy "settings_select" on public.settings
  for select to authenticated using (true);
create policy "settings_write_admin" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- Stockage : photos des joueurs (bucket public en lecture)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do nothing;

create policy "player_photos_read" on storage.objects
  for select using (bucket_id = 'player-photos');
create policy "player_photos_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'player-photos');
create policy "player_photos_update" on storage.objects
  for update to authenticated using (bucket_id = 'player-photos');
create policy "player_photos_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'player-photos');
