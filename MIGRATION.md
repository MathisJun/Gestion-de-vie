# Migration de Supabase vers Prisma

## ✅ Changements effectués

### 1. Remplacement de Supabase
- ❌ `@supabase/supabase-js` et `@supabase/ssr` supprimés
- ✅ `@prisma/client` et `prisma` ajoutés
- ✅ `next-auth` pour l'authentification
- ✅ `bcryptjs` pour le hash des mots de passe
- ✅ `pg` pour PostgreSQL

### 2. Schéma de base de données
- ✅ Schéma Prisma créé (`prisma/schema.prisma`)
- ✅ Toutes les tables migrées depuis SQL vers Prisma
- ✅ Relations et contraintes définies

### 3. Authentification
- ✅ NextAuth.js configuré
- ✅ Route `/api/auth/[...nextauth]` créée
- ✅ Route `/api/auth/register` pour l'inscription
- ✅ Page de login adaptée

### 4. API Routes créées
- ✅ `/api/household` - Gestion des foyers
- ⚠️ À créer : Routes pour groceries, subscriptions, trips, restaurants, movies, fuel

### 5. Scripts
- ✅ `scripts/setup.ts` - Setup automatique
- ✅ `scripts/init-db.sh` - Initialisation DB
- ✅ `prisma/seed.ts` - Données de test

## ⚠️ À faire

Les pages suivantes doivent être adaptées pour utiliser les API routes au lieu de Supabase :
1. `app/app/groceries/page.tsx` - Créer `/api/groceries/*`
2. `app/app/subscriptions/page.tsx` - Créer `/api/subscriptions/*`
3. `app/app/trips/page.tsx` - Créer `/api/trips/*`
4. `app/app/restaurants/page.tsx` - Créer `/api/restaurants/*`
5. `app/app/movies/page.tsx` - Créer `/api/movies/*`
6. `app/app/fuel/page.tsx` - Créer `/api/fuel/*`

## 📝 Notes

- Le système offline (IndexedDB) reste fonctionnel mais doit être adapté pour synchroniser avec les API routes
- Les fichiers Supabase (`lib/supabase/*`) peuvent être supprimés une fois la migration complète
- Les migrations SQL Supabase (`supabase/migrations/*`) ne sont plus nécessaires
