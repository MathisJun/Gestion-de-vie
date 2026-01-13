# Gestionnaire de Vie - Application pour Couple

Application web PWA complète pour gérer la vie quotidienne d'un couple : courses, abonnements, voyages, restaurants, films et consommation essence.

## 🚀 Stack Technique

- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Backend**: Prisma + PostgreSQL
- **Auth**: NextAuth.js
- **State Management**: TanStack Query (React Query)
- **Cartes**: MapLibre GL
- **Graphiques**: Recharts
- **PWA**: next-pwa
- **Offline**: IndexedDB (via idb)

## 📋 Prérequis

- Node.js 18+ et npm/yarn
- PostgreSQL (local ou distant)

## 🛠️ Installation Automatique

### Option 1 : Script automatique (macOS/Linux)

```bash
# 1. Installer les dépendances
npm install

# 2. Initialiser la base de données (crée la DB si elle n'existe pas)
./scripts/init-db.sh

# 3. Configurer .env
cp .env.example .env
# Éditez .env et configurez DATABASE_URL si nécessaire

# 4. Créer les tables dans la base de données
npm run db:push

# 5. (Optionnel) Ajouter des données de test
npm run db:seed

# 6. Lancer l'application
npm run dev
```

### Option 2 : Installation manuelle

1. **Installer PostgreSQL** :
   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14
   
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. **Créer la base de données** :
   ```bash
   createdb gestionnaire_vie
   ```

3. **Installer les dépendances** :
   ```bash
   npm install
   ```

4. **Configurer les variables d'environnement** :
   Créez un fichier `.env` à la racine :
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/gestionnaire_vie?schema=public"
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=changez-moi-en-production-avec-une-cle-secrete
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Créer les tables** :
   ```bash
   npm run db:push
   ```

6. **Lancer l'application** :
   ```bash
   npm run dev
   ```

## 📱 Utilisation

### Première connexion

1. Allez sur http://localhost:3000
2. Créez un compte (inscription)
3. Après connexion, créez votre foyer
4. Le deuxième utilisateur peut se connecter et rejoindre le même foyer (fonctionnalité à venir)

### Compte de test (si vous avez exécuté le seed)

- Email: `test@example.com`
- Password: `password123`

### Fonctionnalités principales

#### 🛒 Nos courses
- Ajouter des articles avec catégories
- Mode "Maison" : cocher quand il manque quelque chose → passe en "À acheter"
- Mode "Course" : vue optimisée pour faire les courses, tri par catégorie
- **Fonctionne hors-ligne** : les modifications sont synchronisées automatiquement quand vous revenez en ligne

#### 💳 Nos abonnements
- Suivi des abonnements mensuels/annuels
- Calcul du total mensuel
- Alertes visuelles pour les renouvellements dans les 7 jours

#### ✈️ Nos voyages
- Créer des voyages avec dates et localisation
- Ajouter des "spots" géolocalisés sur une carte
- Upload de photos/vidéos pour chaque spot (à configurer avec un service de stockage)

#### 🍽️ Nos restaurants
- Liste de restaurants avec notes, cuisine, prix
- Carte interactive avec tous les restaurants
- Lien direct vers Google Maps

#### 🎬 Nos films
- Liste de films à voir / vus
- Notes et commentaires
- Partage par email
- Import en masse depuis un texte (1 film par ligne)

#### ⛽ Consommation essence
- Enregistrer les pleins (date, km, litres, prix)
- Calcul automatique de la consommation (L/100km) et coût/100km
- Graphiques de suivi
- Export CSV

## 🔒 Sécurité

- Authentification sécurisée via NextAuth.js avec hash bcrypt
- Les utilisateurs ne peuvent accéder qu'aux données de leur foyer
- Validation des données avec Zod

## 📦 Structure du projet

```
projetx/
├── app/                    # Pages Next.js (App Router)
│   ├── api/               # API Routes (Prisma)
│   ├── app/               # Pages de l'application
│   └── login/             # Page de connexion
├── components/            # Composants React
├── lib/                   # Utilitaires
│   ├── prisma.ts          # Client Prisma
│   └── auth.ts            # Configuration NextAuth
├── prisma/
│   ├── schema.prisma      # Schéma de base de données
│   └── seed.ts            # Données de test
└── scripts/
    ├── setup.ts           # Script de setup
    └── init-db.sh         # Script d'initialisation DB
```

## 🚧 Commandes utiles

```bash
# Développement
npm run dev

# Build production
npm run build
npm start

# Base de données
npm run db:push          # Appliquer le schéma
npm run db:studio        # Ouvrir Prisma Studio (GUI)
npm run db:seed          # Ajouter des données de test
npm run setup            # Setup initial

# Autres
npm run lint             # Linter
npm run type-check       # Vérification TypeScript
```

## 🐛 Dépannage

### Erreur de connexion PostgreSQL
- Vérifiez que PostgreSQL est démarré : `pg_isready`
- Vérifiez la variable `DATABASE_URL` dans `.env`
- Vérifiez les permissions de l'utilisateur PostgreSQL

### Erreur Prisma
- Exécutez `npx prisma generate` après avoir modifié le schéma
- Vérifiez que les migrations sont à jour : `npm run db:push`

### Erreur NextAuth
- Vérifiez que `NEXTAUTH_SECRET` est défini dans `.env`
- En production, utilisez une clé secrète forte

## 📄 Licence

Ce projet est fourni à titre d'exemple. Libre à vous de l'adapter selon vos besoins.
