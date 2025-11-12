import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/namespaces/[id] - Get a single namespace
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const namespace = await prisma.namespace.findUnique({
      where: { id },
      include: {
        permissions: {
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
        },
      },
    });

    if (!namespace) {
      return NextResponse.json({ error: 'Namespace not found' }, { status: 404 });
    }

    return NextResponse.json(namespace);
  } catch (error) {
    console.error('Error fetching namespace:', error);
    return NextResponse.json({ error: 'Failed to fetch namespace' }, { status: 500 });
  }
}

// PUT /api/namespaces/[id] - Update a namespace
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const namespace = await prisma.namespace.update({
      where: { id },
      data: {
        displayName: body.displayName,
        description: body.description,
        color: body.color,
        icon: body.icon,
      },
    });

    return NextResponse.json(namespace);
  } catch (error) {
    console.error('Error updating namespace:', error);
    return NextResponse.json({ error: 'Failed to update namespace' }, { status: 500 });
  }
}

// DELETE /api/namespaces/[id] - Delete a namespace
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.namespace.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Namespace deleted successfully' });
  } catch (error) {
    console.error('Error deleting namespace:', error);
    return NextResponse.json({ error: 'Failed to delete namespace' }, { status: 500 });
  }
}
