# 🚀 Démarrage Rapide

## Installation en 5 minutes

### 1. Installer PostgreSQL

**macOS** :
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian)** :
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows** :
- Téléchargez depuis [postgresql.org](https://www.postgresql.org/download/windows/)
- Installez et démarrez le service

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer la base de données

**Option A - Script automatique (macOS/Linux)** :
```bash
./scripts/init-db.sh
```

**Option B - Manuel** :
```bash
createdb gestionnaire_vie
```

### 4. Configurer l'environnement

Créez un fichier `.env` :
```env
DATABASE_URL="postgresql://votre_user:password@localhost:5432/gestionnaire_vie?schema=public"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=changez-moi-en-production-avec-une-cle-secrete-aleatoire
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Générer NEXTAUTH_SECRET** :
```bash
openssl rand -base64 32
```

### 5. Créer les tables

```bash
npm run db:push
```

### 6. (Optionnel) Ajouter des données de test

```bash
npm run db:seed
```

### 7. Lancer l'application

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

## 🎯 Compte de test (après seed)

- Email: `test@example.com`
- Password: `password123`

## ✅ Vérification

Si tout fonctionne, vous devriez voir :
1. La page de connexion
2. Pouvoir créer un compte
3. Pouvoir créer un foyer
4. Accéder à l'application

## 🐛 Problèmes courants

### PostgreSQL n'est pas démarré
```bash
# macOS
brew services start postgresql@14

# Linux
sudo systemctl start postgresql
```

### Erreur de connexion à la base de données
- Vérifiez que PostgreSQL est démarré
- Vérifiez `DATABASE_URL` dans `.env`
- Vérifiez les permissions de l'utilisateur PostgreSQL

### Erreur Prisma
```bash
npx prisma generate
npm run db:push
```
