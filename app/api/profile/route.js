import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper function to validate UUID format
function isValidUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// GET /api/profile?userId=xxx - Get user profile
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');

    // If no userId provided or invalid UUID, try to find user by email or get admin user
    if (!userId || !isValidUUID(userId)) {
      console.log('Invalid or missing userId, looking for default user...');

      // Try to get the first admin user as a default
      const adminUser = await prisma.user.findFirst({
        where: { role: 'admin' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          name: true,
          email: true,
          role: true,
        }
      });

      if (adminUser) {
        userId = adminUser.id;
        console.log('Using admin user:', adminUser.email);
      } else {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        samAccountName: true,
        email: true,
        role: true,
        enabled: true,
        location: true,
        department: true,
        profilePhoto: true,
        createdAt: true,
        updatedAt: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
          },
        },
        groupMemberships: {
          include: {
            group: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request) {
  try {
    const body = await request.json();
    let { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Ensure userId is a string (handle both string and numeric IDs from localStorage)
    userId = String(userId);

    // Validate UUID format
    if (!isValidUUID(userId)) {
      console.error('Invalid user ID format:', userId);
      return NextResponse.json(
        { error: 'Invalid user ID format. Please log out and log back in.' },
        { status: 400 }
      );
    }

    // Only allow updating specific fields
    const allowedFields = ['firstName', 'lastName', 'location', 'department', 'email'];
    const filteredData = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        // Convert empty strings to null for optional fields
        if (field === 'location' || field === 'department') {
          filteredData[field] = updateData[field] === '' ? null : updateData[field];
        } else {
          filteredData[field] = updateData[field];
        }
      }
    }

    // Update name if firstName or lastName changed
    if (filteredData.firstName || filteredData.lastName) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });

      const firstName = filteredData.firstName || currentUser.firstName;
      const lastName = filteredData.lastName || currentUser.lastName;
      filteredData.name = `${firstName} ${lastName}`;
    }

    console.log('Updating user profile with data:', filteredData);

    const user = await prisma.user.update({
      where: { id: userId },
      data: filteredData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        samAccountName: true,
        email: true,
        role: true,
        enabled: true,
        location: true,
        department: true,
        profilePhoto: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error updating profile:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
