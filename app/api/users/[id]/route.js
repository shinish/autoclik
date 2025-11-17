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

    // Check if this is a default admin account
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { samAccountName: true, email: true, role: true, enabled: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const defaultAdminUsernames = ['admin', 'shinish'];
    const isDefaultAdmin = defaultAdminUsernames.includes(currentUser.samAccountName) ||
                           defaultAdminUsernames.includes(currentUser.email);

    // If trying to disable/lock a default admin, check if other admins exist
    if (isDefaultAdmin && (body.enabled === false || body.locked === true || body.role !== 'admin')) {
      // Count other active admins (excluding this one)
      const otherAdminsCount = await prisma.user.count({
        where: {
          id: { not: id },
          role: 'admin',
          enabled: true,
          locked: false,
        },
      });

      if (otherAdminsCount === 0) {
        return NextResponse.json(
          { error: 'Cannot disable, lock, or demote the last default admin account. At least one other admin must exist.' },
          { status: 403 }
        );
      }
    }

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
      select: { name: true, samAccountName: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deletion of default admin accounts
    const defaultAdminUsernames = ['admin', 'shinish'];
    const isDefaultAdmin = defaultAdminUsernames.includes(user.samAccountName) ||
                           defaultAdminUsernames.includes(user.email);

    if (isDefaultAdmin) {
      // Count other active admins (excluding this one)
      const otherAdminsCount = await prisma.user.count({
        where: {
          id: { not: id },
          role: 'admin',
          enabled: true,
          locked: false,
        },
      });

      if (otherAdminsCount === 0) {
        return NextResponse.json(
          { error: 'Cannot delete the last default admin account. At least one other admin must exist.' },
          { status: 403 }
        );
      }
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
