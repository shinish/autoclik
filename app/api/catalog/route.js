import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/catalog - Get all catalogs (filtered by user permissions)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const namespaceId = searchParams.get('namespaceId');

    let catalogs;

    if (namespaceId) {
      // Filter by specific namespace
      catalogs = await prisma.catalog.findMany({
        where: { namespaceId },
        include: {
          environment: true,
          executions: {
            take: 1,
            orderBy: { startedAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (userEmail) {
      // Get user's accessible catalogs based on namespace permissions
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        include: {
          groupMemberships: {
            include: {
              group: {
                include: {
                  permissions: true,
                },
              },
            },
          },
          permissions: true,
        },
      });

      if (!user) {
        // User not found - return all catalogs for now (for users not in database yet)
        catalogs = await prisma.catalog.findMany({
          include: {
            environment: true,
            executions: {
              take: 1,
              orderBy: { startedAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(catalogs);
      }

      // Admin users see all catalogs
      if (user.role === 'admin') {
        catalogs = await prisma.catalog.findMany({
          include: {
            environment: true,
            executions: {
              take: 1,
              orderBy: { startedAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(catalogs);
      }

      // Get all namespace IDs where user has at least read permission
      const accessibleNamespaceIds = new Set();

      // Direct user permissions
      user.permissions
        .filter(p => p.canRead)
        .forEach(p => accessibleNamespaceIds.add(p.namespaceId));

      // Group permissions
      user.groupMemberships.forEach(membership => {
        membership.group.permissions
          .filter(p => p.canRead)
          .forEach(p => accessibleNamespaceIds.add(p.namespaceId));
      });

      // If user has no namespace permissions, return all catalogs (temporary)
      if (accessibleNamespaceIds.size === 0) {
        catalogs = await prisma.catalog.findMany({
          include: {
            environment: true,
            executions: {
              take: 1,
              orderBy: { startedAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        catalogs = await prisma.catalog.findMany({
          where: {
            namespaceId: { in: Array.from(accessibleNamespaceIds) },
          },
          include: {
            environment: true,
            executions: {
              take: 1,
              orderBy: { startedAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      }
    } else {
      // No filter - return all catalogs (admin view)
      catalogs = await prisma.catalog.findMany({
        include: {
          environment: true,
          executions: {
            take: 1,
            orderBy: { startedAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json(catalogs);
  } catch (error) {
    console.error('Error fetching catalogs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch catalogs' },
      { status: 500 }
    );
  }
}

// POST /api/catalog - Create a new catalog
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      tags,
      namespaceId,
      environmentId,
      templateId,
      customBody,
      formSchema,
      createdBy,
    } = body;

    // Validate required fields
    if (!name || !namespaceId || !environmentId || !templateId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create catalog
    const catalog = await prisma.catalog.create({
      data: {
        name,
        description,
        tags: tags ? JSON.stringify(tags) : null,
        namespaceId,
        environmentId,
        templateId,
        customBody,
        formSchema,
        isLocked: true, // Lock template settings immediately after creation
        createdBy: createdBy || 'system',
      },
      include: {
        environment: true,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'created',
        entityType: 'catalog',
        entityId: catalog.id,
        entityName: catalog.name,
        description: `Created catalog: ${catalog.name}`,
        performedBy: createdBy || 'system',
      },
    });

    return NextResponse.json(catalog, { status: 201 });
  } catch (error) {
    console.error('Error creating catalog:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create catalog' },
      { status: 500 }
    );
  }
}
