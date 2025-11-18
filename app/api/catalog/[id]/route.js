import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/catalog/[id] - Get a specific catalog
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const catalog = await prisma.catalog.findUnique({
      where: { id },
      include: {
        environment: true,
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!catalog) {
      return NextResponse.json({ error: 'Catalog not found' }, { status: 404 });
    }

    return NextResponse.json(catalog);
  } catch (error) {
    console.error('Error fetching catalog:', error);
    return NextResponse.json(
      { error: 'Failed to fetch catalog' },
      { status: 500 }
    );
  }
}

// PUT /api/catalog/[id] - Update a catalog
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      tags,
      customBody,
      formSchema,
      performedBy,
    } = body;

    // Get existing catalog to check if it's locked
    const existingCatalog = await prisma.catalog.findUnique({
      where: { id },
    });

    if (!existingCatalog) {
      return NextResponse.json({ error: 'Catalog not found' }, { status: 404 });
    }

    // Prepare update data - only allow editing certain fields
    const updateData = {
      name,
      description,
      tags: tags ? JSON.stringify(tags) : null,
      customBody,
      formSchema,
    };

    // Template settings (environmentId, templateId) cannot be changed if locked
    if (existingCatalog.isLocked) {
      // Remove any attempt to change locked fields
      delete updateData.environmentId;
      delete updateData.templateId;
    }

    const catalog = await prisma.catalog.update({
      where: { id },
      data: updateData,
      include: {
        environment: true,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'updated',
        entityType: 'catalog',
        entityId: catalog.id,
        entityName: catalog.name,
        description: `Updated catalog: ${catalog.name}`,
        performedBy: performedBy || 'system',
      },
    });

    return NextResponse.json(catalog);
  } catch (error) {
    console.error('Error updating catalog:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update catalog' },
      { status: 500 }
    );
  }
}

// DELETE /api/catalog/[id] - Delete a catalog
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const performedBy = searchParams.get('performedBy') || 'system';

    const catalog = await prisma.catalog.findUnique({
      where: { id },
    });

    if (!catalog) {
      return NextResponse.json({ error: 'Catalog not found' }, { status: 404 });
    }

    await prisma.catalog.delete({
      where: { id },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'deleted',
        entityType: 'catalog',
        entityId: id,
        entityName: catalog.name,
        description: `Deleted catalog: ${catalog.name}`,
        performedBy,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting catalog:', error);
    return NextResponse.json(
      { error: 'Failed to delete catalog' },
      { status: 500 }
    );
  }
}
