#!/bin/bash

echo "🚀 Initialisation de la base de données..."

# Vérifier si PostgreSQL est installé
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL n'est pas installé."
    echo "💡 Installez PostgreSQL avec: brew install postgresql@14"
    exit 1
fi

# Vérifier si PostgreSQL est démarré
if ! pg_isready -q; then
    echo "⚠️  PostgreSQL n'est pas démarré. Démarrage..."
    brew services start postgresql@14 2>/dev/null || echo "💡 Démarrez PostgreSQL manuellement"
fi

# Créer la base de données si elle n'existe pas
DB_NAME="gestionnaire_vie"
DB_USER="${POSTGRES_USER:-$(whoami)}"

echo "📦 Création de la base de données '$DB_NAME'..."

psql -U "$DB_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"

if [ $? -eq 0 ]; then
    echo "✅ Base de données créée avec succès"
else
    echo "⚠️  La base de données existe peut-être déjà ou erreur de création"
fi

echo ""
echo "✅ Initialisation terminée !"
echo ""
echo "📝 Configurez votre fichier .env avec:"
echo "   DATABASE_URL=\"postgresql://$DB_USER:password@localhost:5432/$DB_NAME?schema=public\""
echo ""
echo "🔧 Ensuite, exécutez:"
echo "   npm run db:push"
echo "   npm run setup"
