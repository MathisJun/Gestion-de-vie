import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// AUTHENTIFICATION TEMPORAIREMENT DÉSACTIVÉE
export async function GET() {
  try {
    // Récupérer le premier household disponible ou en créer un par défaut
    let household = await prisma.household.findFirst({
      include: {
        members: true,
      },
    });

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
        include: {
          members: true,
        },
      });
    }

    return NextResponse.json({
      household_id: household.id,
      household,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// AUTHENTIFICATION TEMPORAIREMENT DÉSACTIVÉE
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Create household sans utilisateur
    const household = await prisma.household.create({
      data: {
        name,
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

    return NextResponse.json({ household_id: household.id, household });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
