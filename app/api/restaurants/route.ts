import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDefaultHousehold } from '@/lib/utils/get-household';

// AUTHENTIFICATION TEMPORAIREMENT DÉSACTIVÉE
export async function GET() {
  try {
    const household = await getDefaultHousehold();

    const restaurants = await prisma.restaurant.findMany({
      where: { householdId: household.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ restaurants });
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
    const {
      name,
      address,
      lat,
      lng,
      rating,
      cuisine,
      priceLevel,
      notes,
      googleMapsUrl,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        householdId: household.id,
        name,
        address: address || null,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        rating: rating ? parseInt(rating) : null,
        cuisine: cuisine || null,
        priceLevel: priceLevel || null,
        notes: notes || null,
        googleMapsUrl: googleMapsUrl || null,
      },
    });

    return NextResponse.json(restaurant, { status: 201 });
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

    await prisma.restaurant.delete({
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

