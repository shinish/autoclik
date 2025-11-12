import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/users/[id] - Get a single user
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        groupMemberships: {
          include: {
            group: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Generate full name from firstName and lastName if they're being updated
    const updateData = {
      firstName: body.firstName,
      lastName: body.lastName,
      name: body.firstName && body.lastName ? `${body.firstName} ${body.lastName}` : undefined,
      samAccountName: body.samAccountName,
      email: body.email,
      role: body.role,
      location: body.location,
      department: body.department,
      managerId: body.managerId || null,
      enabled: body.enabled,
      locked: body.locked,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        groupMemberships: {
          include: {
            group: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
          },
        },
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'updated',
        entityType: 'user',
        entityId: user.id,
        entityName: user.name,
        description: `Updated user "${user.name}"`,
        performedBy: body.performedBy || 'admin',
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email or username already exists' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const performedBy = searchParams.get('performedBy') || 'admin';

    const user = await prisma.user.findUnique({
      where: { id },
      select: { name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'deleted',
        entityType: 'user',
        entityId: id,
        entityName: user.name,
        description: `Deleted user "${user.name}"`,
        performedBy,
      },
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
