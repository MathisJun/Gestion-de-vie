import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// AUTHENTIFICATION TEMPORAIREMENT DÉSACTIVÉE
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { householdId } = body;

    if (!householdId) {
      return NextResponse.json(
        { error: 'Household ID is required' },
        { status: 400 }
      );
    }

    // Check if household exists
    const household = await prisma.household.findUnique({
      where: { id: householdId },
    });

    if (!household) {
      return NextResponse.json(
        { error: 'Foyer non trouvé' },
        { status: 404 }
      );
    }

    // En mode temporaire, on retourne juste le household
    return NextResponse.json({
      message: 'Foyer rejoint avec succès',
      household_id: householdId,
      household,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

