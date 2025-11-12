import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Total automations
    const totalAutomations = await prisma.automation.count();

    // Total runs in last 30 days
    const runs30d = await prisma.run.count({
      where: {
        startedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Success rate (last 30 days)
    const totalRuns = await prisma.run.count({
      where: {
        startedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const successfulRuns = await prisma.run.count({
      where: {
        startedAt: {
          gte: thirtyDaysAgo,
        },
        status: 'success',
      },
    });

    const successRate = totalRuns > 0 ? ((successfulRuns / totalRuns) * 100).toFixed(1) : '0';

    // Active schedules
    const schedulesActive = await prisma.schedule.count({
      where: {
        status: 'active',
      },
    });

    // Recent activity
    const recentActivity = await prisma.run.findMany({
      take: 5,
      orderBy: { startedAt: 'desc' },
      include: {
        automation: {
          select: {
            name: true,
          },
        },
      },
    });

    // Recent notifications
    const notifications = await prisma.notification.findMany({
      take: 5,
      where: { read: false },
      orderBy: { createdAt: 'desc' },
    });

    // Pinned automations
    const pinnedAutomations = await prisma.automation.findMany({
      where: { pinned: true },
      take: 10,
      orderBy: { runs: 'desc' },
    });

    return NextResponse.json({
      stats: {
        totalAutomations,
        runs30d,
        successRate: `${successRate}%`,
        schedulesActive,
      },
      recentActivity,
      notifications,
      pinnedAutomations,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
