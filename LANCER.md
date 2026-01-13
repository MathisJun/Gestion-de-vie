# 🚀 Comment lancer le projet

## Étape 1 : Installer PostgreSQL

### macOS (avec Homebrew)
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Vérifier l'installation
```bash
psql --version
pg_isready
```

## Étape 2 : Créer la base de données

```bash
# Se connecter à PostgreSQL
psql postgres

# Dans le terminal PostgreSQL, créer la base de données
CREATE DATABASE gestionnaire_vie;

# Quitter
\q
```

**OU** utiliser le script automatique :
```bash
./scripts/init-db.sh
```

## Étape 3 : Installer les dépendances Node.js

```bash
npm install
```

## Étape 4 : Configurer les variables d'environnement

Créez ou modifiez le fichier `.env.local` :

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://votre_user:password@localhost:5432/gestionnaire_vie?schema=public"

# NextAuth (générer une clé secrète)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre-cle-secrete-aleatoire-ici

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Pour générer NEXTAUTH_SECRET** :
```bash
openssl rand -base64 32
```

## Étape 5 : Créer les tables dans la base de données

```bash
npm run db:push
```

## Étape 6 : (Optionnel) Ajouter des données de test

```bash
npm run db:seed
```

Cela créera un compte de test :
- Email: `test@example.com`
- Password: `password123`

## Étape 7 : Lancer l'application

```bash
npm run dev
```

Ouvrez votre navigateur sur : **http://localhost:3000**

## ✅ Vérification

Si tout fonctionne :
1. Vous voyez la page de connexion
2. Vous pouvez créer un compte
3. Vous pouvez créer un foyer
4. Vous accédez à l'application

## 🐛 Problèmes courants

### PostgreSQL n'est pas démarré
```bash
# macOS
brew services start postgresql@14

# Vérifier
pg_isready
```

### Erreur de connexion à la base de données
- Vérifiez que PostgreSQL est démarré
- Vérifiez `DATABASE_URL` dans `.env.local`
- Remplacez `votre_user` par votre nom d'utilisateur PostgreSQL (généralement votre nom d'utilisateur système)

### Erreur "relation does not exist"
```bash
npm run db:push
```

### Erreur Prisma
```bash
npx prisma generate
npm run db:push
```

### Port 3000 déjà utilisé
Changez le port :
```bash
PORT=3001 npm run dev
```

## 📝 Commandes utiles

```bash
# Développement
npm run dev

# Voir la base de données (interface graphique)
npm run db:studio

# Réinitialiser la base de données
npm run db:push -- --force-reset

# Vérifier les types TypeScript
npm run type-check
```
