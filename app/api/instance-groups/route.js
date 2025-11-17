import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logInfo, logError } from '@/lib/logger';
import { createErrorResponse } from '@/lib/errorHandler';

// GET /api/instance-groups - Get all instance groups
export async function GET(request) {
  try {
    logInfo('📦 Fetching instance groups');

    const instanceGroups = await prisma.instanceGroup.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(instanceGroups);
  } catch (error) {
    logError('Failed to fetch instance groups', error);
    return createErrorResponse(error, 'Failed to fetch instance groups');
  }
}

// POST /api/instance-groups - Create a new instance group
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, awxId, description, enabled = true, createdBy } = body;

    logInfo('📦 Creating instance group', { name });

    // Validate required fields
    if (!name || !createdBy) {
      return NextResponse.json(
        { error: 'Name and createdBy are required' },
        { status: 400 }
      );
    }

    // Check if instance group with same name already exists
    const existing = await prisma.instanceGroup.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Instance group with this name already exists' },
        { status: 409 }
      );
    }

    // Create instance group
    const instanceGroup = await prisma.instanceGroup.create({
      data: {
        name,
        awxId,
        description,
        enabled,
        createdBy,
      },
    });

    logInfo('✅ Instance group created successfully', { id: instanceGroup.id, name });

    return NextResponse.json(instanceGroup, { status: 201 });
  } catch (error) {
    logError('Failed to create instance group', error);
    return createErrorResponse(error, 'Failed to create instance group');
  }
}
