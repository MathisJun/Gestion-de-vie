import { prisma } from '@/lib/prisma';

// AUTHENTIFICATION TEMPORAIREMENT DÉSACTIVÉE
// Fonction helper pour récupérer le household par défaut
export async function getDefaultHousehold() {
  // Récupérer le premier household disponible ou en créer un par défaut
  let household = await prisma.household.findFirst();

  if (!household) {
    // Créer un household par défaut
    household = await prisma.household.create({
      data: {
        name: 'Foyer par défaut',
        groceryCategories: {
          createMany: {
            data: [
              { name: 'Fruits/Légumes' },
              { name: 'Viandes' },
              { name: 'Hygiène' },
              { name: 'Maison' },
              { name: 'Autre' },
            ],
          },
        },
        groceryLists: {
          create: {
            name: 'Liste principale',
          },
        },
      },
    });
  }

  return household;
}

