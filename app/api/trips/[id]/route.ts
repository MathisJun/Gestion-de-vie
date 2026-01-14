import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// AUTHENTIFICATION TEMPORAIREMENT DÉSACTIVÉE
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        spots: {
          include: {
            media: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json({ trip });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

