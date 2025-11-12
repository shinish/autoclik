import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/users/[id]/reset-password - Reset user password
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { newPassword, performedBy } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id },
      select: { name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        locked: false, // Unlock account when password is reset
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'updated',
        entityType: 'user',
        entityId: id,
        entityName: user.name,
        description: `Password reset for user "${user.name}"`,
        performedBy: performedBy || 'admin',
        metadata: JSON.stringify({
          action: 'password_reset',
          email: user.email,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Error resetting password:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
