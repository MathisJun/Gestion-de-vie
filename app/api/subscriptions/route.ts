import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addMonths, addYears } from 'date-fns';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = await prisma.householdMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!member) {
      return NextResponse.json({ subscriptions: [] });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { householdId: member.householdId },
      orderBy: { nextRenewal: 'asc' },
    });

    return NextResponse.json({ subscriptions });
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

    const member = await prisma.householdMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!member) {
      return NextResponse.json({ error: 'No household' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      provider,
      billingCycle,
      price,
      startDate,
      endDate,
      paymentMethod,
      notes,
    } = body;

    if (!name || !billingCycle || !price || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const nextRenewal =
      billingCycle === 'monthly'
        ? addMonths(start, 1)
        : addYears(start, 1);

    const subscription = await prisma.subscription.create({
      data: {
        householdId: member.householdId,
        name,
        provider: provider || null,
        billingCycle,
        price: parseFloat(price),
        startDate: start,
        endDate: endDate ? new Date(endDate) : null,
        nextRenewal,
        paymentMethod: paymentMethod || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Id is required' }, { status: 400 });
    }

    await prisma.subscription.delete({
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
