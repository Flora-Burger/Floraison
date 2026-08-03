# Floraison

Application de suivi du cycle menstruel (Expo + React Native + Supabase).

- **Mobile** : Expo Go ou build natif (iOS / Android)
- **Web** : déployable sur [Vercel](https://vercel.com)

## Prérequis

- Node.js 20+
- Compte [Supabase](https://supabase.com)
- Pour le mobile : [Expo Go](https://expo.dev/go)

## Installation locale

```bash
git clone https://github.com/VOTRE_USER/floraison.git
cd floraison
npm install
cp .env.example .env
# éditez .env avec vos clés Supabase
```

### Base de données Supabase

Dans le **SQL Editor** de votre projet Supabase, exécutez dans l'ordre :

1. `supabase/migrations/001_cycle_data.sql` — table `cycle_data` + RLS
2. `supabase/migrations/002_cycle_data_grants.sql` — grants
3. `supabase/migrations/003_account_deletion.sql` — suppression de compte (`delete_own_account`)

La migration `004_user_companion.sql` (ancienne sync compagnon) n’est plus utilisée par l’app.

### Auth (reset mot de passe)

**Authentication → URL Configuration** :

| Champ | Valeur |
|-------|--------|
| Site URL | `floraison://reset-password` (mobile) ou `https://votre-app.vercel.app` (web) |
| Redirect URLs | `floraison://reset-password`, `exp://**`, `https://votre-app.vercel.app/reset-password` |

## Lancer en développement

```bash
npm start          # Expo (LAN)
npm run web        # Navigateur
npm run android    # Android
npm run ios        # iOS
npm run test:cycle # tests logiques cycle (sans Jest)
```

## Fonctionnalités principales

- Suivi quotidien (règles, symptômes, humeur, sommeil…) + calendrier prédictif
- Phase du jour + log rapide (dont mode jour difficile)
- Insights & motifs (symptômes × phases) + comparaison de cycles
- Mode doux / pause prédictions (auto si cycles très irréguliers, ou manuel)
- Rappels locaux → ouvrent Suivi au tap
- Export PDF médecin + export perso JSON/CSV
- Contenu Corps (phases)
- PIN local, onboarding, suppression de compte
- Jour local (fuseau téléphone) documenté dans Réglages

### PWA (web)

Après `expo export -p web`, le script `scripts/patch-pwa.mjs` ajoute le manifest et un raccourci **Log rapide** (`/?quicklog=1`).

## Déployer sur Vercel

1. Poussez le code sur **GitHub** (sans le fichier `.env`)
2. Sur [vercel.com](https://vercel.com) : **Add New Project** → importez le repo
3. Vercel détecte `vercel.json` automatiquement
4. Ajoutez les variables d'environnement :
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
5. Déployez

Après le premier déploiement, ajoutez l'URL Vercel (`https://xxx.vercel.app/reset-password`) dans les **Redirect URLs** Supabase.

## Structure

```
App.tsx              # Point d'entrée UI principal
src/
  components/        # Onglets et composants
  constants/         # Thème, symptômes, contenu phases
  lib/               # Logique cycle, auth, notifs, PDF
supabase/migrations/ # Schéma PostgreSQL
assets/              # Icônes et splash
scripts/             # patch-pwa, tests cycle
```

## Licence

Voir [LICENSE](LICENSE).
