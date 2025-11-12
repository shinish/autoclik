import { NextResponse } from 'next/server';
import { generateUniqueRunId } from '@/lib/runIdGenerator';

/**
 * POST /api/runs/reserve-id - Reserve a Task ID for an upcoming run
 * This actually increments the counter and reserves the ID
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { user } = body;

    // Generate and reserve a unique Task ID
    const reservedTaskId = await generateUniqueRunId(user);

    return NextResponse.json({
      success: true,
      taskId: reservedTaskId,
      message: 'Task ID reserved successfully',
    });
  } catch (error) {
    console.error('Error reserving Task ID:', error);
    return NextResponse.json(
      { error: 'Failed to reserve Task ID', details: error.message },
      { status: 500 }
    );
  }
}
