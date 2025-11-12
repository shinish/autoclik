import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/tags - Get all unique tags from automations
export async function GET() {
  try {
    // Get all automations with tags
    const automations = await prisma.automation.findMany({
      select: {
        tags: true,
      },
    });

    // Extract and flatten all tags
    const allTags = automations
      .map(auto => {
        try {
          return JSON.parse(auto.tags || '[]');
        } catch {
          return [];
        }
      })
      .flat();

    // Get unique tags and sort alphabetically
    const uniqueTags = [...new Set(allTags)].sort();

    return NextResponse.json(uniqueTags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}
