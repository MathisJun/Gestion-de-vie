import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDefaultHousehold } from '@/lib/utils/get-household';

// AUTHENTIFICATION TEMPORAIREMENT DÉSACTIVÉE
export async function GET() {
  try {
    const household = await getDefaultHousehold();

    const entries = await prisma.fuelEntry.findMany({
      where: { householdId: household.id },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ entries });
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
    const { date, odometerKm, liters, totalPrice, station } = body;

    if (!date || odometerKm === undefined || liters === undefined || totalPrice === undefined) {
      return NextResponse.json(
        { error: 'Date, odometerKm, liters, and totalPrice are required' },
        { status: 400 }
      );
    }

    const entry = await prisma.fuelEntry.create({
      data: {
        householdId: household.id,
        date: new Date(date),
        odometerKm: parseFloat(odometerKm),
        liters: parseFloat(liters),
        totalPrice: parseFloat(totalPrice),
        station: station || null,
      },
    });

    return NextResponse.json(entry, { status: 201 });
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

    await prisma.fuelEntry.delete({
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

