import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDefaultHousehold } from '@/lib/utils/get-household';

// AUTHENTIFICATION TEMPORAIREMENT DÉSACTIVÉE
export async function GET() {
  try {
    const household = await getDefaultHousehold();

    const trips = await prisma.trip.findMany({
      where: { householdId: household.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ trips });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const household = await getDefaultHousehold();

    const body = await request.json();
    const { title, country, city, startDate, endDate, description } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const trip = await prisma.trip.create({
      data: {
        householdId: household.id,
        title,
        country: country || null,
        city: city || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        description: description || null,
      },
    });

    return NextResponse.json(trip, { status: 201 });
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

    await prisma.trip.delete({
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

