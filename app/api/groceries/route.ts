import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDefaultHousehold } from '@/lib/utils/get-household';

// AUTHENTIFICATION TEMPORAIREMENT DÉSACTIVÉE
export async function GET() {
  try {
    const household = await getDefaultHousehold();

    // Get grocery list
    const list = await prisma.groceryList.findFirst({
      where: { householdId: household.id },
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
        where: { householdId: household.id },
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Id is required' }, { status: 400 });
    }

    await prisma.groceryItem.delete({
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
