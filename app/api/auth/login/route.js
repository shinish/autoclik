import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/auth/login - Authenticate user
export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user has a password set
    if (!user.password) {
      return NextResponse.json(
        { error: 'Account not configured. Please contact administrator.' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Log login activity
    try {
      await prisma.activity.create({
        data: {
          action: 'login',
          entityType: 'user',
          entityId: user.id,
          entityName: user.name,
          description: `${user.name} logged in`,
          performedBy: user.email,
          metadata: JSON.stringify({
            email: user.email,
            department: user.department || 'N/A',
            location: user.location || 'N/A',
            role: user.role,
            timestamp: new Date().toISOString()
          })
        }
      });
    } catch (activityError) {
      console.error('Failed to log login activity:', activityError);
      // Don't fail login if activity logging fails
    }

    // Return user data (excluding password and sensitive fields)
    const { password: _, samAccountName, enabled, locked, managerId, createdAt, updatedAt, ...userData } = user;

    return NextResponse.json({
      success: true,
      user: userData, // Returns: id, name, email, role, department, location, firstName, lastName, profilePhoto
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
