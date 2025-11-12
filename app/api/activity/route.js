import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/activity - Fetch all activity logs
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const action = searchParams.get('action');
    const userEmail = searchParams.get('userEmail');
    const userRole = searchParams.get('userRole');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where = {};

    if (entityType && entityType !== 'all') {
      where.entityType = entityType;
    }

    if (action && action !== 'all') {
      where.action = action;
    }

    // Filter by user email for non-admin users
    if (userEmail && userRole !== 'admin') {
      where.performedBy = userEmail;
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}
