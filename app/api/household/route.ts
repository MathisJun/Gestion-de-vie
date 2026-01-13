import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = await prisma.householdMember.findFirst({
      where: { userId: session.user.id },
      include: {
        household: true,
      },
    });

    if (!member) {
      return NextResponse.json({ household_id: null });
    }

    return NextResponse.json({
      household_id: member.householdId,
      household: member.household,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Create household
    const household = await prisma.household.create({
      data: {
        name,
        members: {
          create: {
            userId: session.user.id,
            role: 'owner',
          },
        },
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
