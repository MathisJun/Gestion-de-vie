import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Démarrage du setup...\n');

  // Vérifier la connexion à la base de données
  try {
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie\n');
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    console.log('\n💡 Assurez-vous que PostgreSQL est démarré et que DATABASE_URL est correctement configuré dans .env');
    process.exit(1);
  }

  // Créer les catégories par défaut pour chaque household existant
  const households = await prisma.household.findMany({
    include: {
      groceryCategories: true,
    },
  });

  for (const household of households) {
    const existingCategories = household.groceryCategories.map((c) => c.name);
    const defaultCategories = [
      'Fruits/Légumes',
      'Viandes',
      'Hygiène',
      'Maison',
      'Autre',
    ];

    for (const categoryName of defaultCategories) {
      if (!existingCategories.includes(categoryName)) {
        await prisma.groceryCategory.create({
          data: {
            householdId: household.id,
            name: categoryName,
          },
        });
        console.log(`✅ Catégorie "${categoryName}" créée pour le foyer "${household.name}"`);
      }
    }

    // Créer une liste par défaut si elle n'existe pas
    const lists = await prisma.groceryList.findMany({
      where: { householdId: household.id },
    });

    if (lists.length === 0) {
      await prisma.groceryList.create({
        data: {
          householdId: household.id,
          name: 'Liste principale',
        },
      });
      console.log(`✅ Liste principale créée pour le foyer "${household.name}"`);
    }
  }

  console.log('\n✅ Setup terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du setup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
