import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

// GET /api/schedules - List all schedules
export async function GET() {
  try {
    const schedules = await prisma.schedule.findMany({
      include: {
        automation: {
          select: {
            id: true,
            name: true,
            namespace: true,
          },
        },
      },
      orderBy: { nextRun: 'asc' },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}

// POST /api/schedules - Create a new schedule
export async function POST(request) {
  try {
    const body = await request.json();

    const schedule = await prisma.schedule.create({
      data: {
        name: body.name,
        automationId: body.automationId,
        frequency: body.frequency,
        cron: body.cron,
        parameters: JSON.stringify(body.parameters || {}),
        status: body.status || 'active',
        nextRun: body.nextRun ? new Date(body.nextRun) : null,
      },
      include: {
        automation: {
          select: {
            name: true,
          },
        },
      },
    });

    // Log activity
    await logActivity({
      action: 'created',
      entityType: 'schedule',
      entityId: schedule.id,
      entityName: schedule.name,
      performedBy: body.createdBy || 'system',
      description: `Created schedule "${schedule.name}" for automation "${schedule.automation.name}"`,
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}
