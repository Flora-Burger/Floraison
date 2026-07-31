# Floraison

Application de suivi du cycle menstruel (Expo + React Native + Supabase), avec un compagnon plante qui évolue avec tes phases.

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
4. `supabase/migrations/004_user_companion.sql` — sync compagnon (rareté / message du jour)

Sans la **004**, la sync multi-appareils de la plante est un no-op (le reste de l'app fonctionne).

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
- Compagnon plante (phase, réactions, espèces nommées à l’ovulation, murmure au tap) + message du jour
- **Rituel d’aube** — seuil poétique à la première ouverture du jour
- **Collection florale** — 8 espèces à l’ovulation, saisons du pot, fleur signature, cartes postales
- Check-in du soir + bannière préparation règles
- Synthèse « ce cycle en 3 lignes » à la clôture
- Insights « ce qui revient chez toi » + comparaison douce (jours difficiles)
- Export perso JSON/CSV + PDF médecin
- Jour local (fuseau téléphone) documenté dans Réglages
- Insights & motifs personnels (dont humeur × sommeil)
- Log rapide + mode « jour difficile »
- Notes privées par phase (historique multi-cycles)
- Rituel de clôture de cycle
- Mode doux / pause prédictions (auto si cycles très irréguliers, ou manuel)
- Streak douce
- Rappels locaux → ouvrent Suivi au tap
- Partage amie (texte / image)
- PIN local, onboarding, suppression de compte

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
  constants/         # Thème, symptômes, espèces florales, messages
  lib/               # Logique cycle, auth, notifs, PDF
supabase/migrations/ # Schéma PostgreSQL
assets/              # Icônes et splash
scripts/             # patch-pwa, tests cycle
```

## Licence

Voir [LICENSE](LICENSE).
