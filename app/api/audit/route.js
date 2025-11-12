import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/audit - Get audit statistics and chart data
export async function GET(request) {
  // Set headers to prevent caching and ensure live data
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30days'; // 30days, daily, weekly, monthly, custom
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query filter based on time range
    let whereClause = {};
    const now = new Date();

    if (range === '30days') {
      // Last 30 days (matches Dashboard)
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      whereClause = {
        startedAt: {
          gte: thirtyDaysAgo,
        },
      };
    } else if (range === 'daily') {
      // Last 7 days
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      whereClause = {
        startedAt: {
          gte: sevenDaysAgo,
        },
      };
    } else if (range === 'weekly') {
      // Last 8 weeks (56 days)
      const eightWeeksAgo = new Date(now);
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
      eightWeeksAgo.setHours(0, 0, 0, 0);
      whereClause = {
        startedAt: {
          gte: eightWeeksAgo,
        },
      };
    } else if (range === 'monthly') {
      // Last 6 months
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      sixMonthsAgo.setHours(0, 0, 0, 0);
      whereClause = {
        startedAt: {
          gte: sixMonthsAgo,
        },
      };
    } else if (range === 'custom' && startDate && endDate) {
      whereClause = {
        startedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    }

    // Get all runs (filtered by date range)
    const runs = await prisma.run.findMany({
      where: whereClause,
      orderBy: { startedAt: 'desc' },
      take: 10000, // High limit to get all runs in range
    });

    // Calculate overall stats
    const stats = {
      total: runs.length,
      success: runs.filter(r => r.status === 'success').length,
      failed: runs.filter(r => r.status === 'failed').length,
      running: runs.filter(r => r.status === 'running').length,
      pending: runs.filter(r => r.status === 'pending').length,
    };

    // Generate chart data based on time range
    const chartData = generateChartData(runs, range, startDate, endDate);

    return NextResponse.json({ stats, chartData }, { headers });
  } catch (error) {
    console.error('Error fetching audit data:', error);
    return NextResponse.json({ error: 'Failed to fetch audit data' }, { status: 500, headers });
  }
}

function generateChartData(runs, range, startDate, endDate) {
  const now = new Date();
  const data = [];

  if (range === '30days') {
    // Last 30 days (matches Dashboard)
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayRuns = runs.filter(r => {
        const runDate = new Date(r.startedAt);
        return runDate >= date && runDate < nextDate;
      });

      data.push({
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        date: date.toISOString(),
        total: dayRuns.length,
        success: dayRuns.filter(r => r.status === 'success').length,
        failed: dayRuns.filter(r => r.status === 'failed').length,
        running: dayRuns.filter(r => r.status === 'running').length,
        pending: dayRuns.filter(r => r.status === 'pending').length,
      });
    }
  } else if (range === 'daily') {
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayRuns = runs.filter(r => {
        const runDate = new Date(r.startedAt);
        return runDate >= date && runDate < nextDate;
      });

      data.push({
        label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        date: date.toISOString(),
        total: dayRuns.length,
        success: dayRuns.filter(r => r.status === 'success').length,
        failed: dayRuns.filter(r => r.status === 'failed').length,
        running: dayRuns.filter(r => r.status === 'running').length,
        pending: dayRuns.filter(r => r.status === 'pending').length,
      });
    }
  } else if (range === 'weekly') {
    // Last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const startDateWeek = new Date(now);
      startDateWeek.setDate(startDateWeek.getDate() - (i * 7) - now.getDay()); // Start of week (Sunday)
      startDateWeek.setHours(0, 0, 0, 0);

      const endDateWeek = new Date(startDateWeek);
      endDateWeek.setDate(endDateWeek.getDate() + 7);

      const weekRuns = runs.filter(r => {
        const runDate = new Date(r.startedAt);
        return runDate >= startDateWeek && runDate < endDateWeek;
      });

      data.push({
        label: `Week of ${startDateWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        date: startDateWeek.toISOString(),
        total: weekRuns.length,
        success: weekRuns.filter(r => r.status === 'success').length,
        failed: weekRuns.filter(r => r.status === 'failed').length,
        running: weekRuns.filter(r => r.status === 'running').length,
        pending: weekRuns.filter(r => r.status === 'pending').length,
      });
    }
  } else if (range === 'monthly') {
    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthRuns = runs.filter(r => {
        const runDate = new Date(r.startedAt);
        return runDate >= date && runDate < nextDate;
      });

      data.push({
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        date: date.toISOString(),
        total: monthRuns.length,
        success: monthRuns.filter(r => r.status === 'success').length,
        failed: monthRuns.filter(r => r.status === 'failed').length,
        running: monthRuns.filter(r => r.status === 'running').length,
        pending: monthRuns.filter(r => r.status === 'pending').length,
      });
    }
  } else if (range === 'custom' && startDate && endDate) {
    // Custom date range - generate daily breakdown
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // If range is more than 90 days, group by week
    if (daysDiff > 90) {
      const weeks = Math.ceil(daysDiff / 7);
      for (let i = 0; i < weeks; i++) {
        const weekStart = new Date(start);
        weekStart.setDate(weekStart.getDate() + (i * 7));

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        if (weekEnd > end) weekEnd.setTime(end.getTime());

        const weekRuns = runs.filter(r => {
          const runDate = new Date(r.startedAt);
          return runDate >= weekStart && runDate < weekEnd;
        });

        data.push({
          label: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          date: weekStart.toISOString(),
          total: weekRuns.length,
          success: weekRuns.filter(r => r.status === 'success').length,
          failed: weekRuns.filter(r => r.status === 'failed').length,
          running: weekRuns.filter(r => r.status === 'running').length,
          pending: weekRuns.filter(r => r.status === 'pending').length,
        });
      }
    } else {
      // Daily breakdown for ranges under 90 days
      for (let i = 0; i <= daysDiff; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayRuns = runs.filter(r => {
          const runDate = new Date(r.startedAt);
          return runDate >= date && runDate < nextDate;
        });

        data.push({
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          date: date.toISOString(),
          total: dayRuns.length,
          success: dayRuns.filter(r => r.status === 'success').length,
          failed: dayRuns.filter(r => r.status === 'failed').length,
          running: dayRuns.filter(r => r.status === 'running').length,
          pending: dayRuns.filter(r => r.status === 'pending').length,
        });
      }
    }
  }

  return data;
}
