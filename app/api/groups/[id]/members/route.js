import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/groups/[id]/members - Add a member to a group
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if member already exists
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this group' }, { status: 409 });
    }

    // Add member to group
    const member = await prisma.groupMember.create({
      data: {
        userId,
        groupId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'added',
        entityType: 'group_member',
        entityId: member.id,
        entityName: `${user.name} to ${group.name}`,
        description: `Added user "${user.name}" to group "${group.name}"`,
        performedBy: body.performedBy || 'admin',
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error adding member to group:', error);
    return NextResponse.json({ error: 'Failed to add member to group' }, { status: 500 });
  }
}

// DELETE /api/groups/[id]/members/[userId] - Remove a member from a group
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const performedBy = searchParams.get('performedBy') || 'admin';

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get member info before deleting
    const member = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: id,
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        group: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found in this group' }, { status: 404 });
    }

    // Delete the member
    await prisma.groupMember.delete({
      where: {
        userId_groupId: {
          userId,
          groupId: id,
        },
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'removed',
        entityType: 'group_member',
        entityId: member.id,
        entityName: `${member.user.name} from ${member.group.name}`,
        description: `Removed user "${member.user.name}" from group "${member.group.name}"`,
        performedBy,
      },
    });

    return NextResponse.json({ success: true, message: 'Member removed from group' });
  } catch (error) {
    console.error('Error removing member from group:', error);
    return NextResponse.json({ error: 'Failed to remove member from group' }, { status: 500 });
  }
}
