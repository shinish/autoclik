import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

// GET /api/automations/[id] - Get a single automation
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const automation = await prisma.automation.findUnique({
      where: { id },
      include: {
        runs_history: {
          take: 10,
          orderBy: { startedAt: 'desc' },
        },
        schedules: true,
      },
    });

    if (!automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    // Look up the user who created this automation to get their name
    let createdByName = automation.createdBy;
    if (automation.createdBy) {
      const user = await prisma.user.findUnique({
        where: { email: automation.createdBy },
        select: { firstName: true, lastName: true, name: true },
      });

      if (user) {
        // Use full name if available, otherwise construct from first/last name
        createdByName = user.name || `${user.firstName} ${user.lastName}`;
      }
    }

    // Return automation with the user's name instead of email
    return NextResponse.json({
      ...automation,
      createdBy: createdByName,
    });
  } catch (error) {
    console.error('Error fetching automation:', error);
    return NextResponse.json({ error: 'Failed to fetch automation' }, { status: 500 });
  }
}

// PUT /api/automations/[id] - Update an automation
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Helper function to safely stringify if not already a string
    const safeStringify = (value, fallback = []) => {
      if (typeof value === 'string') {
        return value; // Already a string, don't double-stringify
      }
      return JSON.stringify(value || fallback);
    };

    const automation = await prisma.automation.update({
      where: { id },
      data: {
        name: body.name,
        namespace: body.namespace,
        description: body.description,
        keywords: safeStringify(body.keywords, []),
        tags: safeStringify(body.tags, []),
        formSchema: safeStringify(body.formSchema, []),
        apiEndpoint: '', // Always empty - use global setting from Settings
        templateId: body.templateId,
        inventoryId: body.inventoryId,
        extraVars: body.extraVars,
        pinned: body.pinned,
        featured: body.featured,
      },
    });

    // Log activity
    await logActivity({
      action: 'updated',
      entityType: 'automation',
      entityId: automation.id,
      entityName: automation.name,
      performedBy: automation.createdBy,
      description: `Updated automation "${automation.name}"`,
    });

    return NextResponse.json(automation);
  } catch (error) {
    console.error('Error updating automation:', error);
    return NextResponse.json({ error: 'Failed to update automation' }, { status: 500 });
  }
}

// DELETE /api/automations/[id] - Delete an automation
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Get automation details before deleting
    const automation = await prisma.automation.findUnique({
      where: { id },
    });

    if (!automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    await prisma.automation.delete({
      where: { id },
    });

    // Log activity
    await logActivity({
      action: 'deleted',
      entityType: 'automation',
      entityId: id,
      entityName: automation.name,
      performedBy: automation.createdBy,
      description: `Deleted automation "${automation.name}"`,
    });

    return NextResponse.json({ message: 'Automation deleted successfully' });
  } catch (error) {
    console.error('Error deleting automation:', error);
    return NextResponse.json({ error: 'Failed to delete automation' }, { status: 500 });
  }
}
