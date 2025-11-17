import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logInfo } from '@/lib/logger';
import { createErrorResponse } from '@/lib/errorHandler';

export async function GET(request) {
  try {
    // Get user email from query parameters
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    logInfo('📊 Fetching dashboard data', { userEmail: userEmail || 'all users' });

    // Get total automations count
    const totalAutomations = await prisma.automation.count();

    // Get runs in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Filter runs by user if userEmail is provided
    const runsFilter = {
      startedAt: {
        gte: thirtyDaysAgo,
      },
    };
    if (userEmail) {
      runsFilter.executedBy = userEmail;
    }

    const runs30d = await prisma.run.count({
      where: runsFilter,
    });

    // Calculate success rate from last 30 days (filtered by user)
    const totalRuns = await prisma.run.count({
      where: runsFilter,
    });
    const successfulRuns = await prisma.run.count({
      where: {
        ...runsFilter,
        status: 'success'
      },
    });
    const successRate = totalRuns > 0
      ? ((successfulRuns / totalRuns) * 100).toFixed(1) + '%'
      : '0%';

    // Get active schedules count
    const schedulesActive = await prisma.schedule.count({
      where: { status: 'active' },
    });

    // Get recent activity (last 10 activities, filtered by user)
    const activityFilter = userEmail ? { performedBy: userEmail } : {};
    const recentActivity = await prisma.activity.findMany({
      where: activityFilter,
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    // Format recent activity
    const formattedActivity = recentActivity.map(activity => {
      const now = new Date();
      const activityDate = new Date(activity.createdAt);
      const diffMs = now - activityDate;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let timeAgo;
      if (diffMins < 60) {
        timeAgo = diffMins < 1 ? 'Just now' : `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays === 1) {
        timeAgo = 'Yesterday';
      } else {
        timeAgo = `${diffDays} days ago`;
      }

      return {
        id: activity.id,
        name: activity.entityName,
        description: activity.description || `${activity.action} ${activity.entityType}`,
        action: activity.action,
        entityType: activity.entityType,
        time: timeAgo,
      };
    });

    // Get recent notifications (last 10)
    const notifications = await prisma.notification.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    // Format notifications with time ago
    const formattedNotifications = notifications.map(notif => {
      const now = new Date();
      const notifDate = new Date(notif.createdAt);
      const diffMs = now - notifDate;
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let timeAgo;
      if (diffHours < 1) {
        timeAgo = 'Just now';
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays === 1) {
        timeAgo = 'Yesterday';
      } else {
        timeAgo = `${diffDays} days ago`;
      }

      return {
        id: notif.id,
        type: notif.type,
        title: notif.title,
        time: timeAgo,
      };
    });

    // Get pinned automations
    const pinnedAutomations = await prisma.automation.findMany({
      where: { pinned: true },
      take: 4,
      orderBy: { runs: 'desc' },
    });

    // Check if this is first time setup or if there are no automations
    const firstTimeSetup = await prisma.setting.findUnique({
      where: { key: 'first_time_setup' },
    });

    // Show welcome message if first time setup OR no automations exist
    const showWelcome = firstTimeSetup?.value === 'true' || totalAutomations === 0;

    return NextResponse.json({
      stats: {
        totalAutomations,
        runs30d,
        successRate,
        schedulesActive,
      },
      recentActivity: formattedActivity,
      notifications: formattedNotifications.slice(0, 3), // Only show 3 on dashboard
      pinnedAutomations: pinnedAutomations.map(auto => ({
        id: auto.id,
        name: auto.name,
        description: auto.description,
        runs: auto.runs,
      })),
      firstTimeSetup: showWelcome,
    });
  } catch (error) {
    return createErrorResponse(error, 'Failed to fetch dashboard data');
  }
}
