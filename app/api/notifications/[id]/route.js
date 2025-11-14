import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createErrorResponse } from '@/lib/errorHandler';

// PATCH /api/notifications/[id] - Mark notification as read
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const notification = await prisma.notification.update({
      where: { id },
      data: {
        read: body.read ?? true,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    // P2025 means record not found
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return createErrorResponse(error, 'Failed to update notification');
  }
}

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await prisma.notification.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    // P2025 means record not found - treat as success since the notification doesn't exist
    if (error?.code === 'P2025') {
      return NextResponse.json({ message: 'Notification already deleted or does not exist' });
    }

    return createErrorResponse(error, 'Failed to delete notification');
  }
}
