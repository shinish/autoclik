import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/groups/[id] - Get a single group
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                email: true,
              },
            },
          },
        },
        modulePermissions: true,
        permissions: {
          include: {
            namespace: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}

// PUT /api/groups/[id] - Update a group
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData = {
      name: body.name,
      description: body.description,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const group = await prisma.group.update({
      where: { id },
      data: updateData,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                email: true,
              },
            },
          },
        },
        modulePermissions: true,
      },
    });

    // Update module permissions if provided
    if (body.modulePermissions && Array.isArray(body.modulePermissions)) {
      // Delete existing permissions
      await prisma.modulePermission.deleteMany({
        where: { groupId: id },
      });

      // Create new permissions
      if (body.modulePermissions.length > 0) {
        await prisma.modulePermission.createMany({
          data: body.modulePermissions.map(perm => ({
            groupId: id,
            module: perm.module,
            canRead: perm.canRead !== undefined ? perm.canRead : true,
            canWrite: perm.canWrite !== undefined ? perm.canWrite : false,
            canDelete: perm.canDelete !== undefined ? perm.canDelete : false,
          })),
        });
      }
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'updated',
        entityType: 'group',
        entityId: group.id,
        entityName: group.name,
        description: `Updated group "${group.name}"`,
        performedBy: body.performedBy || 'admin',
      },
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error updating group:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Group name already exists' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

// DELETE /api/groups/[id] - Delete a group
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const performedBy = searchParams.get('performedBy') || 'admin';

    const group = await prisma.group.findUnique({
      where: { id },
      select: { name: true, isPredefined: true },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Prevent deletion of predefined groups
    if (group.isPredefined) {
      return NextResponse.json(
        { error: 'Cannot delete predefined system groups' },
        { status: 403 }
      );
    }

    await prisma.group.delete({
      where: { id },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'deleted',
        entityType: 'group',
        entityId: id,
        entityName: group.name,
        description: `Deleted group "${group.name}"`,
        performedBy,
      },
    });

    return NextResponse.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
