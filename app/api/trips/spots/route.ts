import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// AUTHENTIFICATION TEMPORAIREMENT DÉSACTIVÉE
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tripId, title, lat, lng, description } = body;

    if (!tripId || !title || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'TripId, title, lat, and lng are required' },
        { status: 400 }
      );
    }

    const spot = await prisma.tripSpot.create({
      data: {
        tripId,
        title,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        description: description || null,
      },
    });

    return NextResponse.json(spot, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Id is required' }, { status: 400 });
    }

    await prisma.tripSpot.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

