import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/settings - Get all settings or a specific setting by key
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      // Get a specific setting by key
      const setting = await prisma.setting.findUnique({
        where: { key },
      });

      if (!setting) {
        return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
      }

      return NextResponse.json(setting);
    }

    // Get all settings
    const settings = await prisma.setting.findMany({
      orderBy: { key: 'asc' },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST /api/settings - Create a new setting
export async function POST(request) {
  try {
    const body = await request.json();

    const setting = await prisma.setting.create({
      data: {
        key: body.key,
        value: body.value,
        description: body.description || null,
      },
    });

    return NextResponse.json(setting, { status: 201 });
  } catch (error) {
    console.error('Error creating setting:', error);
    return NextResponse.json({ error: 'Failed to create setting' }, { status: 500 });
  }
}

// PUT /api/settings - Update a setting by key
export async function PUT(request) {
  try {
    const body = await request.json();
    const { key, value, description } = body;

    if (!key) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: {
        value,
        description,
      },
      create: {
        key,
        value,
        description,
      },
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}

// DELETE /api/settings?key=<key> - Delete a setting by key
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
    }

    await prisma.setting.delete({
      where: { key },
    });

    return NextResponse.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return NextResponse.json({ error: 'Failed to delete setting' }, { status: 500 });
  }
}
