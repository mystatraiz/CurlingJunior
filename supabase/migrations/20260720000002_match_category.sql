-- ============================================================
-- Catégorie des matchs : hommes / femmes / mixte
-- À exécuter dans l'éditeur SQL Supabase si la base a été créée
-- avec la migration initiale (les nouvelles installations
-- l'incluent déjà — d'où le IF NOT EXISTS).
-- ============================================================

alter table public.matches
  add column if not exists category text not null default 'mixte'
  check (category in ('hommes', 'femmes', 'mixte'));
