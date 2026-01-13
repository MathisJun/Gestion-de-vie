#!/bin/bash

echo "🚀 Démarrage du projet Gestionnaire de Vie"
echo ""

# Vérifier PostgreSQL
if ! pg_isready -q 2>/dev/null; then
    echo "⚠️  PostgreSQL n'est pas démarré"
    echo "💡 Démarrage de PostgreSQL..."
    brew services start postgresql@14 2>/dev/null || {
        echo "❌ Impossible de démarrer PostgreSQL automatiquement"
        echo "💡 Démarrez-le manuellement avec: brew services start postgresql@14"
        exit 1
    }
    sleep 2
fi

# Vérifier si la base de données existe
DB_NAME="gestionnaire_vie"
DB_USER=$(whoami)

if ! psql -U "$DB_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 2>/dev/null; then
    echo "📦 Création de la base de données '$DB_NAME'..."
    createdb "$DB_NAME" 2>/dev/null || {
        echo "❌ Impossible de créer la base de données"
        echo "💡 Créez-la manuellement avec: createdb $DB_NAME"
        exit 1
    }
    echo "✅ Base de données créée"
fi

# Vérifier node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install || {
        echo "❌ Erreur lors de l'installation des dépendances"
        exit 1
    }
fi

# Vérifier .env.local
if [ ! -f ".env.local" ]; then
    echo "⚠️  Fichier .env.local non trouvé"
    echo "💡 Créez-le avec les variables d'environnement nécessaires"
    exit 1
fi

# Créer les tables
echo "🔧 Création des tables..."
npm run db:push || {
    echo "❌ Erreur lors de la création des tables"
    exit 1
}

echo ""
echo "✅ Tout est prêt !"
echo ""
echo "🚀 Lancement de l'application..."
echo "📱 Ouvrez http://localhost:3000 dans votre navigateur"
echo ""

npm run dev
