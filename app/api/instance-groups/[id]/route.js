import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logInfo, logError } from '@/lib/logger';
import { createErrorResponse } from '@/lib/errorHandler';

// GET /api/instance-groups/[id] - Get a specific instance group
export async function GET(request, { params }) {
  try {
    const { id } = params;
    logInfo('📦 Fetching instance group', { id });

    const instanceGroup = await prisma.instanceGroup.findUnique({
      where: { id },
    });

    if (!instanceGroup) {
      return NextResponse.json(
        { error: 'Instance group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(instanceGroup);
  } catch (error) {
    logError('Failed to fetch instance group', error);
    return createErrorResponse(error, 'Failed to fetch instance group');
  }
}

// PUT /api/instance-groups/[id] - Update an instance group
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, awxId, description, enabled } = body;

    logInfo('📦 Updating instance group', { id });

    // Check if instance group exists
    const existing = await prisma.instanceGroup.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Instance group not found' },
        { status: 404 }
      );
    }

    // If name is being changed, check for duplicates
    if (name && name !== existing.name) {
      const duplicate = await prisma.instanceGroup.findUnique({
        where: { name },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Instance group with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Update instance group
    const instanceGroup = await prisma.instanceGroup.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(awxId !== undefined && { awxId }),
        ...(description !== undefined && { description }),
        ...(enabled !== undefined && { enabled }),
      },
    });

    logInfo('✅ Instance group updated successfully', { id });

    return NextResponse.json(instanceGroup);
  } catch (error) {
    logError('Failed to update instance group', error);
    return createErrorResponse(error, 'Failed to update instance group');
  }
}

// DELETE /api/instance-groups/[id] - Delete an instance group
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    logInfo('📦 Deleting instance group', { id });

    // Check if instance group exists
    const existing = await prisma.instanceGroup.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Instance group not found' },
        { status: 404 }
      );
    }

    // Delete instance group
    await prisma.instanceGroup.delete({
      where: { id },
    });

    logInfo('✅ Instance group deleted successfully', { id });

    return NextResponse.json({ message: 'Instance group deleted successfully' });
  } catch (error) {
    logError('Failed to delete instance group', error);
    return createErrorResponse(error, 'Failed to delete instance group');
  }
}
