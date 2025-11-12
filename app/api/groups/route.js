import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/groups - List all groups
export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        modulePermissions: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

// POST /api/groups - Create a new group
export async function POST(request) {
  try {
    const body = await request.json();

    // Create group with module permissions
    const group = await prisma.group.create({
      data: {
        name: body.name,
        description: body.description || '',
        isPredefined: body.isPredefined || false,
        modulePermissions: {
          create: (body.modulePermissions || []).map(perm => ({
            module: perm.module,
            canRead: perm.canRead,
            canWrite: perm.canWrite,
            canDelete: perm.canDelete,
          })),
        },
      },
      include: {
        modulePermissions: true,
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
