# Collectif Junior France – Curling 🥌

Application de suivi des performances des joueurs du **Collectif Junior France de
Curling**, réservée aux entraîneurs et responsables de la fédération.

Progressive Web App (PWA) installable sur iPhone, Android, Windows et Mac —
responsive mobile / tablette / ordinateur, mode sombre, design « bleu glacier ».

## Stack technique

| Couche | Choix | Pourquoi |
|---|---|---|
| Framework | **Next.js 15** (App Router) + **React 19** | SSR/middleware d'auth, PWA, déploiement Vercel en un clic |
| Langage | **TypeScript** (strict) | Fiabilité et évolutivité |
| UI | **TailwindCSS** + **Lucide React** | Design premium cohérent clair/sombre |
| Graphiques | **Recharts** | Courbes, barres, radar — thème daltonien-compatible validé |
| Backend | **Supabase** | Auth email, PostgreSQL + RLS, stockage des photos |
| Tests | **Vitest** | 19 tests unitaires sur le moteur de statistiques |

### Architecture

```
app/                    Pages (App Router) — dashboard, players, trainings,
                        matches, rankings, progression, history, settings
components/
  providers/            Contexts : thème, auth, données, période
  layout/               Sidebar desktop, onglets mobile, sélecteur de période
  charts/               Composants Recharts partagés (thème CSS variables)
  ui/                   Primitives (Card, Button, Modal, RatingInput…)
lib/
  stats.ts              ⭐ Moteur de statistiques — fonctions pures testées
  types.ts              Types du domaine (miroir du schéma SQL)
  supabase/             Clients navigateur + middleware de session
supabase/
  migrations/           Schéma SQL complet (tables, RLS, triggers, storage)
  seed.sql              Données de démonstration (optionnel)
public/sw.js            Service worker (cache hors ligne léger)
scripts/                Génération des icônes PWA
```

**Principe clé** : toutes les statistiques (moyennes, assiduité, points de
matchs, progression, classement général pondéré) sont calculées côté client par
des **fonctions pures** dans `lib/stats.ts` à partir du jeu de données complet.
À l'échelle d'un collectif, c'est instantané, et cela rend le filtrage
« 3 derniers entraînements / saison complète » trivial et testable.

---

## Installation

### 1. Dépendances

```bash
npm install
```

### 2. Projet Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Ouvrez **SQL Editor** et exécutez le contenu de
   `supabase/migrations/20260720000001_init.sql`.
3. (Optionnel) Exécutez `supabase/seed.sql` pour des données de démonstration.

> Avec la CLI Supabase : `supabase link --project-ref <ref>` puis `supabase db push`.

### 3. Variables d'environnement

```bash
cp .env.example .env.local
```

Renseignez `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
(Projet Supabase → Settings → API).

### 4. Lancement

```bash
npm run dev        # développement — http://localhost:3000
npm run build      # build de production
npm start          # serveur de production
npm test           # tests unitaires (moteur de statistiques)
npm run icons      # régénère les icônes PWA
```

---

## Comptes et rôles

- **Le premier compte créé devient automatiquement administrateur** (trigger SQL).
- Créez les comptes entraîneurs depuis le dashboard Supabase :
  **Authentication → Users → Invite user** (ou activez les inscriptions par email).
- L'administrateur gère ensuite les rôles dans **Paramètres → Entraîneurs**.

| Capacité | Admin | Entraîneur |
|---|---|---|
| Consulter statistiques & classements | ✅ | ✅ |
| Créer entraînements, présences, notes, matchs | ✅ | ✅ |
| Gérer les joueurs (créer / modifier) | ✅ | ✅ |
| Supprimer joueurs, entraînements, matchs | ✅ | ❌ |
| Modifier paramètres, saisons, rôles | ✅ | ❌ |

Ces règles sont appliquées **côté base** par Row Level Security — pas seulement
dans l'interface.

## Fonctionnalités

- **Tableau de bord** : effectif, entraînements, présence moyenne, matchs,
  Top 5 (performance / assiduité / attitude / progression), dernier
  entraînement, évolution du collectif, radar des qualités, répartition des
  notes et des victoires.
- **Joueurs** : fiches complètes (photo, infos, statistiques automatiques),
  graphiques individuels, historiques entraînements & matchs.
- **Entraînements** : création rapide — pointage Présent / Absent / Excusé,
  notation Performance /10, Attitude, Sérieux, Implication /5, commentaires.
- **Matchs** : équipes composées depuis l'effectif, score, vainqueur
  automatique, points (victoire 2 pts, défaite 1 pt — configurables).
- **Classements** : 7 classements indépendants (Général pondéré, Performance,
  Attitude, Sérieux, Implication, Assiduité, Matchs).
- **Deux périodes partout** : sélecteur global « 3 derniers entraînements »
  (forme actuelle) / « Saison complète » (régularité).
- **Progression** : joueurs en hausse / en baisse, meilleurs taux, meilleures
  performances récentes.
- **Historique** : toutes les données filtrables par date, joueur, catégorie.
- **Paramètres** : coefficients du classement général (30/25/20/10/10/5 par
  défaut), points de victoire/défaite, saisons, catégories.

## Déploiement (Vercel recommandé)

1. Poussez le dépôt sur GitHub.
2. Sur [vercel.com](https://vercel.com) : **Import Project**, ajoutez les deux
   variables d'environnement, déployez.
3. Dans Supabase → **Authentication → URL Configuration**, renseignez l'URL de
   production (Site URL + Redirect URLs).

L'application est installable depuis le navigateur : « Ajouter à l'écran
d'accueil » (iOS/Android) ou l'icône d'installation (Chrome/Edge desktop).

## Évolutions prévues par l'architecture

- **Statistiques avancées curling** (draw, take-out, guard, % de réussite) :
  ajouter une table `shot_stats(training_id, player_id, shot_type, success)`
  et étendre `lib/stats.ts` — l'UI des fiches joueurs accueille de nouveaux
  onglets sans refonte.
- **Notifications push / convocations** : le service worker est en place ;
  ajouter une souscription Web Push + une table `notifications`.
- **Synchronisation hors ligne** : le SW cache déjà la lecture ; file d'écriture
  IndexedDB à brancher dans `DataProvider.refresh()`.
- **Exports PDF / Excel**, **calendrier des compétitions**, **gestion
  d'équipes**, **application native via Capacitor** : l'app étant 100 % API
  Supabase + fonctions pures, ces modules s'ajoutent sans toucher au cœur.

## Licence

Projet privé — Fédération Française de Curling / Collectif Junior France.
