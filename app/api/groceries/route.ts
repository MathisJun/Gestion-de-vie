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

    // Get user's household
    const member = await prisma.householdMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!member) {
      return NextResponse.json({ items: [], categories: [], list: null });
    }

    // Get grocery list
    const list = await prisma.groceryList.findFirst({
      where: { householdId: member.householdId },
    });

    if (!list) {
      return NextResponse.json({ items: [], categories: [], list: null });
    }

    // Get items and categories
    const [items, categories] = await Promise.all([
      prisma.groceryItem.findMany({
        where: { listId: list.id },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.groceryCategory.findMany({
        where: { householdId: member.householdId },
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({ items, categories, list });
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
    const { name, quantity, categoryId, listId } = body;

    if (!name || !listId) {
      return NextResponse.json(
        { error: 'Name and listId are required' },
        { status: 400 }
      );
    }

    const item = await prisma.groceryItem.create({
      data: {
        name,
        quantity: quantity || null,
        categoryId: categoryId || null,
        listId,
        status: 'HOME',
      },
      include: { category: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Id and status are required' },
        { status: 400 }
      );
    }

    const item = await prisma.groceryItem.update({
      where: { id },
      data: { status },
      include: { category: true },
    });

    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
