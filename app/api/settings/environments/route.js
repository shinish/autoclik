import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/settings/environments - List all AWX environments
export async function GET() {
  try {
    const environments = await prisma.awxEnvironment.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(environments);
  } catch (error) {
    console.error('Error fetching environments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch environments' },
      { status: 500 }
    );
  }
}

// POST /api/settings/environments - Create a new environment
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.baseUrl) {
      return NextResponse.json(
        { error: 'Name and Base URL are required' },
        { status: 400 }
      );
    }

    const environment = await prisma.awxEnvironment.create({
      data: {
        name: body.name,
        baseUrl: body.baseUrl,
        token: body.token || '',
        description: body.description || '',
      },
    });

    return NextResponse.json(environment, { status: 201 });
  } catch (error) {
    console.error('Error creating environment:', error);
    return NextResponse.json(
      { error: 'Failed to create environment' },
      { status: 500 }
    );
  }
}

// PUT /api/settings/environments - Update an environment
export async function PUT(request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'Environment ID is required' },
        { status: 400 }
      );
    }

    const environment = await prisma.awxEnvironment.update({
      where: { id: body.id },
      data: {
        name: body.name,
        baseUrl: body.baseUrl,
        token: body.token,
        description: body.description,
      },
    });

    return NextResponse.json(environment);
  } catch (error) {
    console.error('Error updating environment:', error);
    return NextResponse.json(
      { error: 'Failed to update environment' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/environments - Delete an environment
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Environment ID is required' },
        { status: 400 }
      );
    }

    // Check if environment is assigned to any catalogs
    const catalogCount = await prisma.catalog.count({
      where: { environmentId: id },
    });

    if (catalogCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete environment',
          message: `This environment is assigned to ${catalogCount} catalog${catalogCount > 1 ? 's' : ''}. Please reassign or delete the catalog${catalogCount > 1 ? 's' : ''} first.`
        },
        { status: 400 }
      );
    }

    await prisma.awxEnvironment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting environment:', error);
    return NextResponse.json(
      { error: 'Failed to delete environment' },
      { status: 500 }
    );
  }
}
