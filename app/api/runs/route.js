import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/runs - Get all runs with automation details
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const automationId = searchParams.get('automationId');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const where = {};

    if (status) {
      where.status = status;
    }

    if (automationId) {
      where.automationId = automationId;
    }

    const runs = await prisma.run.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      include: {
        automation: {
          select: {
            id: true,
            name: true,
            namespace: true,
          },
        },
      },
      take: Math.min(limit, 100), // Limit with max of 100
    });

    return NextResponse.json(runs);
  } catch (error) {
    console.error('Error fetching runs:', error);
    return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 });
  }
}
