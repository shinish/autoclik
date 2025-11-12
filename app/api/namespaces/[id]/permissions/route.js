import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/namespaces/[id]/permissions - Add permission to namespace
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const permission = await prisma.namespacePermission.create({
      data: {
        namespaceId: id,
        userId: body.userId || null,
        groupId: body.groupId || null,
        canRead: body.canRead ?? true,
        canWrite: body.canWrite ?? false,
        canExecute: body.canExecute ?? false,
        canAdmin: body.canAdmin ?? false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(permission, { status: 201 });
  } catch (error) {
    console.error('Error adding permission:', error);
    return NextResponse.json({ error: 'Failed to add permission' }, { status: 500 });
  }
}

// DELETE /api/namespaces/[id]/permissions - Remove permission
export async function DELETE(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const permissionId = searchParams.get('permissionId');

    if (!permissionId) {
      return NextResponse.json({ error: 'Permission ID required' }, { status: 400 });
    }

    await prisma.namespacePermission.delete({
      where: { id: permissionId },
    });

    return NextResponse.json({ message: 'Permission removed successfully' });
  } catch (error) {
    console.error('Error removing permission:', error);
    return NextResponse.json({ error: 'Failed to remove permission' }, { status: 500 });
  }
}
