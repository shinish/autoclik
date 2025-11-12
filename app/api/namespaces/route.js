import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/namespaces - List all namespaces
export async function GET() {
  try {
    const namespaces = await prisma.namespace.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(namespaces);
  } catch (error) {
    console.error('Error fetching namespaces:', error);
    return NextResponse.json({ error: 'Failed to fetch namespaces' }, { status: 500 });
  }
}

// POST /api/namespaces - Create a new namespace
export async function POST(request) {
  try {
    const body = await request.json();

    const namespace = await prisma.namespace.create({
      data: {
        name: body.name,
        displayName: body.displayName,
        description: body.description || '',
        color: body.color || '#546aff',
        icon: body.icon || '',
        createdBy: body.createdBy || 'admin@example.com',
      },
    });

    return NextResponse.json(namespace, { status: 201 });
  } catch (error) {
    console.error('Error creating namespace:', error);
    return NextResponse.json({ error: 'Failed to create namespace' }, { status: 500 });
  }
}
