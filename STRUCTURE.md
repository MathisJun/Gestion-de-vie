# Structure du Projet

## 📁 Arborescence

```
projetx/
├── app/                          # Pages Next.js (App Router)
│   ├── app/                     # Application principale
│   │   ├── groceries/          # Page courses (offline-first)
│   │   ├── subscriptions/      # Page abonnements
│   │   ├── trips/              # Page voyages
│   │   │   └── [id]/          # Détail d'un voyage
│   │   ├── restaurants/        # Page restaurants
│   │   ├── movies/             # Page films
│   │   ├── fuel/              # Page consommation essence
│   │   ├── setup/             # Page de création de foyer
│   │   ├── layout.tsx         # Layout avec vérification household
│   │   └── page.tsx           # Redirection vers groceries
│   ├── login/                  # Page de connexion/inscription
│   ├── layout.tsx             # Layout racine (providers)
│   ├── providers.tsx          # Providers React Query
│   └── globals.css            # Styles globaux Tailwind
│
├── components/                  # Composants React
│   ├── layout/
│   │   ├── Sidebar.tsx        # Sidebar navigation (desktop + mobile)
│   │   ├── AppLayout.tsx      # Layout principal avec sidebar
│   │   └── HouseholdGuard.tsx # Guard pour vérifier household
│   ├── ui/
│   │   ├── Button.tsx         # Composant bouton réutilisable
│   │   └── Toast.tsx          # Système de notifications toast
│   └── map/
│       ├── TripMap.tsx        # Carte pour les voyages
│       └── RestaurantsMap.tsx # Carte pour les restaurants
│
├── lib/                        # Utilitaires et logique métier
│   ├── supabase/
│   │   ├── client.ts         # Client Supabase (browser)
│   │   ├── server.ts         # Client Supabase (server)
│   │   └── middleware.ts     # Middleware auth
│   ├── hooks/
│   │   └── use-household.ts  # Hook pour récupérer le household
│   ├── offline/
│   │   └── queue.ts          # Gestion queue offline (IndexedDB)
│   └── types/
│       └── database.ts       # Types TypeScript pour Supabase
│
├── supabase/
│   └── migrations/            # Migrations SQL
│       ├── 001_initial_schema.sql    # Schéma de base
│       ├── 002_rls_policies.sql      # Policies RLS
│       └── 003_seed_data.sql         # Données de seed
│
├── public/                     # Assets statiques
│   ├── manifest.json          # Manifest PWA
│   ├── icon-192.png          # Icône PWA 192x192
│   └── icon-512.png          # Icône PWA 512x512
│
├── middleware.ts              # Middleware Next.js (auth)
├── next.config.js             # Configuration Next.js + PWA
├── tailwind.config.ts         # Configuration TailwindCSS
├── tsconfig.json              # Configuration TypeScript
├── package.json               # Dépendances npm
├── README.md                  # Documentation principale
├── TODO.md                    # Liste des améliorations futures
└── STRUCTURE.md              # Ce fichier
```

## 🔑 Points clés

### Authentification
- Gérée par Supabase Auth
- Middleware Next.js pour protéger les routes
- Redirection automatique vers `/login` si non authentifié

### Gestion du Foyer (Household)
- Chaque utilisateur doit appartenir à un `household`
- Création automatique lors de la première connexion (`/app/setup`)
- Toutes les données sont liées au `household_id`
- RLS (Row Level Security) garantit l'isolation des données

### Offline-First (Courses)
- Utilise IndexedDB pour stocker les actions hors-ligne
- Synchronisation automatique quand la connexion revient
- Queue d'actions avec statut `synced`

### PWA
- Manifest configuré
- Service Worker via `next-pwa`
- Installable sur mobile et desktop
- Cache des requêtes Supabase

### Cartes
- MapLibre GL pour les cartes (gratuit, open-source)
- Alternative possible : Google Maps (nécessite clé API)

## 🗄️ Base de données

### Tables principales
1. `households` - Foyers
2. `household_members` - Membres des foyers
3. `grocery_*` - Courses (lists, items, categories)
4. `subscriptions` - Abonnements
5. `trips`, `trip_spots`, `trip_media` - Voyages
6. `restaurants` - Restaurants
7. `movies` - Films
8. `fuel_entries` - Consommation essence

### Sécurité
- RLS activé sur toutes les tables
- Fonction helper `is_household_member()` pour vérifier l'appartenance
- Policies CRUD complètes pour chaque table

## 🎨 UI/UX

### Responsive
- Sidebar sur desktop
- Menu burger + bottom nav sur mobile
- Design mobile-first

### Composants réutilisables
- `Button` - Boutons avec variants
- `Toast` - Notifications toast
- Modals inline (pas de bibliothèque externe)

### Design
- TailwindCSS pour le styling
- Couleurs primaires configurables
- Design épuré et moderne

## 📦 Dépendances principales

- `next` - Framework React
- `@supabase/supabase-js` - Client Supabase
- `@tanstack/react-query` - State management
- `maplibre-gl` - Cartes
- `recharts` - Graphiques
- `idb` - IndexedDB wrapper
- `date-fns` - Manipulation de dates
- `lucide-react` - Icônes
- `next-pwa` - PWA support
