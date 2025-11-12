import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/auth/logout - Log user logout activity
export async function POST(request) {
  try {
    let email, name, department, location, role;

    try {
      const body = await request.json();
      ({ email, name, department, location, role } = body);
    } catch (parseError) {
      // If no body provided, that's okay for logout
      email = 'unknown';
      name = 'Unknown User';
    }

    // Log logout activity if email is provided
    if (email && email !== 'unknown') {
      try {
        await prisma.activity.create({
          data: {
            action: 'logout',
            entityType: 'user',
            entityId: email,
            entityName: name || email,
            description: `${name || email} logged out`,
            performedBy: email,
            metadata: JSON.stringify({
              email: email,
              department: department || 'N/A',
              location: location || 'N/A',
              role: role || 'user',
              timestamp: new Date().toISOString()
            })
          }
        });
      } catch (activityError) {
        console.error('Failed to log logout activity:', activityError);
        // Don't fail logout if activity logging fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}
