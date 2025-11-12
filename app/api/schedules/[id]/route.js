import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT /api/schedules/[id] - Update a schedule
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        name: body.name,
        frequency: body.frequency,
        cron: body.cron,
        status: body.status,
        parameters: body.parameters,
        nextRun: body.nextRun ? new Date(body.nextRun) : null,
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}

// DELETE /api/schedules/[id] - Delete a schedule
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await prisma.schedule.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
