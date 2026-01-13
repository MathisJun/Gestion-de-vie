import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...\n');

  // Créer un utilisateur de test
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Utilisateur Test',
    },
  });

  console.log('✅ Utilisateur créé:', user.email);

  // Créer un foyer
  const household = await prisma.household.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Foyer Test',
    },
  });

  console.log('✅ Foyer créé:', household.name);

  // Ajouter l'utilisateur au foyer
  await prisma.householdMember.upsert({
    where: {
      householdId_userId: {
        householdId: household.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      householdId: household.id,
      userId: user.id,
      role: 'owner',
    },
  });

  console.log('✅ Utilisateur ajouté au foyer');

  // Créer les catégories par défaut
  const categories = ['Fruits/Légumes', 'Viandes', 'Hygiène', 'Maison', 'Autre'];
  for (const categoryName of categories) {
    await prisma.groceryCategory.upsert({
      where: {
        householdId_name: {
          householdId: household.id,
          name: categoryName,
        },
      },
      update: {},
      create: {
        householdId: household.id,
        name: categoryName,
      },
    });
  }

  console.log('✅ Catégories créées');

  // Créer une liste de courses
  const list = await prisma.groceryList.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      householdId: household.id,
      name: 'Liste principale',
    },
  });

  console.log('✅ Liste de courses créée');

  console.log('\n✅ Seed terminé avec succès !');
  console.log('\n📝 Vous pouvez vous connecter avec:');
  console.log('   Email: test@example.com');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
