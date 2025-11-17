import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * POST /api/auth/signup
 * Create a new user account pending admin approval
 *
 * Author: Shinish Sasidharan
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, username, password, department, location } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !username || !password) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Convert username and email to lowercase
    const lowerUsername = username.toLowerCase();
    const lowerEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: lowerEmail },
          { samAccountName: lowerUsername }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with approved=false (pending approval)
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        samAccountName: lowerUsername,
        email: lowerEmail,
        password: hashedPassword,
        department: department || null,
        location: location || null,
        role: 'user',
        enabled: true,
        locked: false,
        approved: false, // Pending admin approval
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'signup_request',
        entityType: 'user',
        entityId: newUser.id,
        entityName: newUser.name,
        description: 'User signup request created',
        performedBy: lowerEmail,
        metadata: JSON.stringify({
          email: lowerEmail,
          username: lowerUsername,
          department: department || 'Not specified',
          location: location || 'Not specified',
          status: 'pending_approval'
        }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Pending admin approval.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
