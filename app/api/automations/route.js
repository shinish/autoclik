import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activity';
import { createNotification } from '@/lib/notification';

// GET /api/automations - List all automations
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const namespace = searchParams.get('namespace');
    const tags = searchParams.get('tags');
    const search = searchParams.get('search');

    const where = {};

    if (namespace && namespace !== 'All') {
      where.namespace = namespace;
    }

    if (tags && tags !== 'All') {
      where.tags = {
        contains: tags,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { keywords: { contains: search } },
      ];
    }

    const automations = await prisma.automation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { runs_history: true, schedules: true },
        },
        runs_history: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: { startedAt: true },
        },
      },
    });

    // Get unique creator emails
    const creatorEmails = [...new Set(automations.map(a => a.createdBy).filter(Boolean))];

    // Look up all users at once for better performance
    const users = await prisma.user.findMany({
      where: { email: { in: creatorEmails } },
      select: { email: true, firstName: true, lastName: true, name: true },
    });

    // Create a map of email to name
    const emailToName = {};
    users.forEach(user => {
      emailToName[user.email] = user.name || `${user.firstName} ${user.lastName}`;
    });

    // Transform the data to include lastExecutedAt and replace email with name
    const transformedAutomations = automations.map(automation => ({
      ...automation,
      executionCount: automation._count.runs_history,
      lastExecutedAt: automation.runs_history[0]?.startedAt || null,
      createdBy: emailToName[automation.createdBy] || automation.createdBy,
      runs_history: undefined, // Remove the full runs_history array
    }));

    return NextResponse.json(transformedAutomations);
  } catch (error) {
    console.error('Error fetching automations:', error);
    return NextResponse.json({ error: 'Failed to fetch automations' }, { status: 500 });
  }
}

// POST /api/automations - Create a new automation
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!body.templateId || !body.templateId.trim()) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Helper function to safely stringify if not already a string
    const safeStringify = (value, fallback = []) => {
      if (typeof value === 'string') {
        return value; // Already a string, don't double-stringify
      }
      return JSON.stringify(value || fallback);
    };

    const automation = await prisma.automation.create({
      data: {
        name: body.name,
        namespace: body.namespace,
        description: body.description || '',
        keywords: safeStringify(body.keywords, []),
        tags: safeStringify(body.tags, []),
        formSchema: safeStringify(body.formSchema, []),
        customBody: body.customBody || '',
        apiEndpoint: '', // Always empty - use global setting from Settings
        templateId: body.templateId || '',
        inventoryId: body.inventoryId || '',
        extraVars: body.extraVars || '',
        pinned: body.pinned || false,
        featured: body.featured || false,
        createdBy: body.createdBy || 'user@email.com',
      },
    });

    // Log activity
    await logActivity({
      action: 'created',
      entityType: 'automation',
      entityId: automation.id,
      entityName: automation.name,
      performedBy: automation.createdBy,
      description: `Created automation "${automation.name}" in ${automation.namespace} namespace`,
    });

    // Create notification
    await createNotification({
      type: 'success',
      title: 'Catalog Created',
      message: `New catalog "${automation.name}" has been created in the ${automation.namespace} namespace`,
    });

    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    console.error('Error creating automation:', error);

    // Check for unique constraint violation
    if (error.code === 'P2002' || error.message.includes('Unique constraint')) {
      return NextResponse.json({
        error: 'An automation with this name already exists. Please choose a different name.'
      }, { status: 409 });
    }

    return NextResponse.json({ error: 'Failed to create automation' }, { status: 500 });
  }
}
