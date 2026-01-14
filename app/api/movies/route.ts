import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDefaultHousehold } from '@/lib/utils/get-household';

// AUTHENTIFICATION TEMPORAIREMENT DÉSACTIVÉE
export async function GET() {
  try {
    const household = await getDefaultHousehold();

    const movies = await prisma.movie.findMany({
      where: { householdId: household.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ movies });
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
    const { name, title, year, status, rating, notes, movies } = body;

    // Support for bulk import
    if (movies && Array.isArray(movies)) {
      const createdMovies = await prisma.movie.createMany({
        data: movies.map((m: any) => ({
          householdId: household.id,
          title: m.title || m.name,
          year: m.year ? parseInt(m.year) : null,
          status: m.status || 'TO_WATCH',
          rating: m.rating ? parseInt(m.rating) : null,
          notes: m.notes || null,
        })),
      });
      return NextResponse.json({ count: createdMovies.count }, { status: 201 });
    }

    // Single movie creation
    if (!title && !name) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const movie = await prisma.movie.create({
      data: {
        householdId: household.id,
        title: title || name,
        year: year ? parseInt(year) : null,
        status: status || 'TO_WATCH',
        rating: rating ? parseInt(rating) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json(movie, { status: 201 });
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

    await prisma.movie.delete({
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

