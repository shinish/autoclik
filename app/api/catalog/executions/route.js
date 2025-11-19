import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const catalogId = searchParams.get('catalogId');

    // Build where clause
    const where = catalogId ? { catalogId } : {};

    // Fetch executions with catalog details
    const executions = await prisma.catalogExecution.findMany({
      where,
      include: {
        catalog: {
          select: {
            name: true,
            namespaceId: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 100, // Limit to last 100 executions
    });

    // Fetch namespaces for catalog executions
    const namespaceIds = [...new Set(executions.map(exec => exec.catalog.namespaceId))];
    const namespaces = await prisma.namespace.findMany({
      where: {
        id: {
          in: namespaceIds,
        },
      },
      select: {
        id: true,
        name: true,
        displayName: true,
      },
    });

    const namespaceMap = {};
    namespaces.forEach(ns => {
      namespaceMap[ns.id] = ns;
    });

    // Transform data for frontend
    const transformedExecutions = executions.map(exec => {
      const namespace = namespaceMap[exec.catalog.namespaceId];
      return {
        id: exec.id,
        catalogId: exec.catalogId,
        catalogName: exec.catalog.name,
        namespaceName: namespace?.displayName || namespace?.name || 'Unknown',
        status: exec.status,
        awxJobId: exec.awxJobId,
        executedBy: exec.executedBy,
        startedAt: exec.startedAt,
        completedAt: exec.completedAt,
        duration: exec.completedAt
          ? Math.round((new Date(exec.completedAt) - new Date(exec.startedAt)) / 1000)
          : null,
        hasArtifacts: !!exec.artifacts,
        parameters: exec.parameters ? JSON.parse(exec.parameters) : null,
      };
    });

    return NextResponse.json(transformedExecutions);
  } catch (error) {
    console.error('Error fetching catalog executions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch catalog executions' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
