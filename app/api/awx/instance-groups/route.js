import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logInfo, logError } from '@/lib/logger';

// GET /api/awx/instance-groups - Get available instance groups from AWX
export async function GET(request) {
  try {
    // Get AWX configuration from settings
    const [awxEndpoint, awxToken, defaultInstanceGroupId] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'default_api_endpoint' } }),
      prisma.setting.findUnique({ where: { key: 'awx_token' } }),
      prisma.setting.findUnique({ where: { key: 'default_instance_group_id' } }),
    ]);

    const defaultId = defaultInstanceGroupId?.value ? parseInt(defaultInstanceGroupId.value, 10) : 298;

    // If AWX is not configured, return default only
    if (!awxEndpoint?.value || !awxToken?.value) {
      logInfo('AWX not configured, returning default instance group');
      return NextResponse.json({
        results: [{ id: defaultId, name: 'Default Instance Group' }],
        defaultId,
        message: 'AWX not configured - showing default only'
      });
    }

    // Normalize base URL
    let baseUrl = awxEndpoint.value;
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    if (!baseUrl.endsWith('/api/v2')) {
      baseUrl = `${baseUrl}/api/v2`;
    }

    // Fetch instance groups from AWX
    const awxUrl = `${baseUrl}/instance_groups/`;

    logInfo('Fetching instance groups from AWX', { url: awxUrl });

    const response = await fetch(awxUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${awxToken.value}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      logError('Failed to fetch instance groups from AWX', { status: response.status });
      // Return default on error
      return NextResponse.json({
        results: [{ id: defaultId, name: 'Default Instance Group' }],
        defaultId,
        message: `AWX returned error ${response.status} - showing default only`
      });
    }

    const data = await response.json();

    // Map AWX response to our format
    const instanceGroups = (data.results || []).map(group => ({
      id: group.id,
      name: group.name,
      description: group.description || '',
    }));

    // If no instance groups found, add default
    if (instanceGroups.length === 0) {
      instanceGroups.push({ id: defaultId, name: 'Default Instance Group' });
    }

    return NextResponse.json({
      results: instanceGroups,
      defaultId,
      count: instanceGroups.length,
    });
  } catch (error) {
    logError('Error fetching instance groups', error);

    // Return default on any error
    return NextResponse.json({
      results: [{ id: 298, name: 'Default Instance Group' }],
      defaultId: 298,
      error: error.message,
    });
  }
}
