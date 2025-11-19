import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createErrorResponse } from '@/lib/errorHandler';

// GET /api/runs - Get all runs with automation details (including catalog executions)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const automationId = searchParams.get('automationId');
    const catalogId = searchParams.get('catalogId');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const where = {};

    if (status) {
      where.status = status;
    }

    if (automationId) {
      where.automationId = automationId;
    }

    // Get automation runs
    const runs = await prisma.run.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      include: {
        automation: {
          select: {
            id: true,
            name: true,
            namespace: true,
          },
        },
      },
      take: Math.min(limit, 100), // Limit with max of 100
    });

    // Get catalog executions
    const catalogWhere = {};
    if (status) catalogWhere.status = status;
    if (catalogId) catalogWhere.catalogId = catalogId;

    const catalogExecutions = await prisma.catalogExecution.findMany({
      where: catalogWhere,
      orderBy: { startedAt: 'desc' },
      include: {
        catalog: {
          select: {
            id: true,
            name: true,
            namespaceId: true,
          },
        },
      },
      take: Math.min(limit, 100),
    });

    // Fetch namespaces for catalog executions
    const namespaceIds = [...new Set(catalogExecutions.map(exec => exec.catalog.namespaceId))];
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

    // Transform catalog executions to match runs format
    const transformedCatalogExecutions = catalogExecutions.map(exec => {
      const namespace = namespaceMap[exec.catalog.namespaceId];
      return {
        id: exec.id,
        automationId: exec.catalogId,
        status: exec.status,
        uniqueId: null,
        parameters: exec.parameters,
        result: exec.consoleOutput,
        artifacts: exec.artifacts,
        errorMessage: exec.errorMessage,
        executedBy: exec.executedBy,
        startedAt: exec.startedAt,
        completedAt: exec.completedAt,
        awxJobId: exec.awxJobId,
        type: 'catalog',
        automation: {
          id: exec.catalog.id,
          name: exec.catalog.name,
          namespace: namespace?.displayName || namespace?.name || 'Catalog',
        },
      };
    });

    // Transform automation runs to include type
    const transformedRuns = runs.map(run => ({
      ...run,
      type: 'automation',
    }));

    // Combine and sort by startedAt
    const allExecutions = [...transformedRuns, ...transformedCatalogExecutions]
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, Math.min(limit, 100));

    return NextResponse.json(allExecutions);
  } catch (error) {
    return createErrorResponse(error, 'Failed to fetch runs');
  }
}
