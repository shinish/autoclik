import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// PUT /api/profile/password - Change user's own password
export async function PUT(request) {
  try {
    const body = await request.json();
    const { userId, currentPassword, newPassword, confirmPassword } = body;

    // Validation
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirmation do not match' },
        { status: 400 }
      );
    }

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'updated',
        entityType: 'user',
        entityId: userId,
        entityName: user.name,
        description: `Password changed by user "${user.name}"`,
        performedBy: user.email,
        metadata: JSON.stringify({
          action: 'password_change',
          changedBy: 'self',
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Error changing password:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
