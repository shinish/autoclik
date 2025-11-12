import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/profile/photo - Update user profile photo
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, photoBase64 } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!photoBase64) {
      return NextResponse.json({ error: 'Photo data is required' }, { status: 400 });
    }

    // Validate base64 format
    if (!photoBase64.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    // Update user profile photo
    const user = await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: photoBase64 },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        profilePhoto: true,
      },
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error updating profile photo:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to update profile photo' }, { status: 500 });
  }
}

// DELETE /api/profile/photo - Remove user profile photo
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Remove profile photo
    const user = await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        profilePhoto: true,
      },
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error removing profile photo:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to remove profile photo' }, { status: 500 });
  }
}
