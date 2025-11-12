import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET /api/users - List all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        groupMemberships: {
          include: {
            group: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
          },
        },
      },
      orderBy: { lastName: 'asc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(request) {
  try {
    const body = await request.json();

    // Generate full name from firstName and lastName
    const fullName = `${body.firstName} ${body.lastName}`;

    // Handle password - use provided password or generate default
    let hashedPassword;
    if (body.password) {
      // Use provided password
      hashedPassword = await bcrypt.hash(body.password, 10);
    } else {
      // Generate default password: first letter of first name + last name + "123"
      // Example: John Doe -> jdoe123
      const defaultPassword = `${body.firstName.toLowerCase().charAt(0)}${body.lastName.toLowerCase()}123`;
      hashedPassword = await bcrypt.hash(defaultPassword, 10);
    }

    const user = await prisma.user.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        name: fullName,
        samAccountName: body.samAccountName,
        email: body.email,
        password: hashedPassword,
        role: body.role || 'user',
        location: body.location || null,
        department: body.department || null,
        managerId: body.managerId || null,
        enabled: body.enabled !== undefined ? body.enabled : true,
        locked: body.locked !== undefined ? body.locked : false,
      },
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      ...userWithoutPassword,
      // Include default password info if one was generated
      defaultPassword: !body.password ? `${body.firstName.toLowerCase().charAt(0)}${body.lastName.toLowerCase()}123` : undefined
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
