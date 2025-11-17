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

    // Find user by email or username (samAccountName)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { samAccountName: email }
        ]
      }
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

    // Check if account is locked
    if (user.locked) {
      return NextResponse.json(
        { error: 'Account is locked. Please contact administrator.' },
        { status: 403 }
      );
    }

    // Check if account is enabled
    if (!user.enabled) {
      return NextResponse.json(
        { error: 'Account is disabled. Please contact administrator.' },
        { status: 403 }
      );
    }

    // Check if account is approved (skip check for default admin accounts)
    const defaultAdminUsernames = ['admin', 'shinish'];
    const isDefaultAdmin = defaultAdminUsernames.includes(user.samAccountName) ||
                           defaultAdminUsernames.includes(user.email);

    if (!user.approved && !isDefaultAdmin) {
      return NextResponse.json(
        { error: 'Account is pending admin approval. You will receive an email notification once approved.' },
        { status: 403 }
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
