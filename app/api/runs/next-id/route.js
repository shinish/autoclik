import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/runs/next-id - Preview the next task ID without consuming it
 * This shows what the next run ID will be for the current user
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('userEmail');

    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2);

    // Determine pool based on user (simplified version)
    const POOLS = ['A', 'B', 'C', 'D', 'E'];
    let poolToUse = 'A'; // Default

    if (userEmail || userId) {
      const identifier = userEmail || userId;
      const hash = identifier.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      poolToUse = POOLS[hash % POOLS.length];
    }

    // Get current counter for this pool
    const counter = await prisma.runCounter.findUnique({
      where: {
        year_pool: {
          year: currentYear,
          pool: poolToUse,
        },
      },
    });

    // Next sequence will be current + 1 (or 1 if no counter exists)
    const nextSequence = counter ? counter.sequence + 1 : 1;
    const sequenceStr = nextSequence.toString().padStart(10, '0');
    const nextTaskId = `TASK${yearSuffix}${poolToUse}${sequenceStr}i`;

    return NextResponse.json({
      nextTaskId,
      pool: poolToUse,
      sequence: nextSequence,
      year: currentYear,
    });
  } catch (error) {
    console.error('Error fetching next task ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch next task ID' },
      { status: 500 }
    );
  }
}
