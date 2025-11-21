import prisma from '@/lib/prisma';

const POOLS = ['00', '01', '02', '03', '04'];

/**
 * Determines which pool (00-04) to use based on user's team/group
 * Each team gets assigned a consistent pool number
 *
 * @param {string} userId - User ID or email
 * @param {Array} userGroups - User's group memberships
 * @returns {string} Pool number (00-04)
 */
function determinePoolForUser(userId, userGroups = []) {
  // If user has groups, use first group to determine pool
  if (userGroups && userGroups.length > 0) {
    const firstGroup = userGroups[0];
    // Hash the group name to consistently assign it to a pool
    const hash = firstGroup.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return POOLS[hash % POOLS.length];
  }

  // If no groups, use user ID/email to determine pool
  if (userId) {
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return POOLS[hash % POOLS.length];
  }

  // Default fallback to pool 00
  return '00';
}

/**
 * Generates a unique run identifier in the format: WSRPT{POOL}-{SEQ}
 * Example: WSRPT00-00001
 *
 * - WSRPT is static prefix
 * - POOL is determined by user's team (00-04)
 * - SEQ is a 5-digit sequential number per pool
 *
 * Pool assignment:
 * - Each team/group gets assigned a consistent pool number (00-04)
 * - Users in the same team will always use the same pool
 * - Sequence numbers increment independently per pool
 *
 * @param {Object} user - User object with id, email, and groups
 * @returns {Promise<string>} Unique run ID
 */
export async function generateUniqueRunId(user = null) {
  const currentYear = new Date().getFullYear();

  // Determine which pool to use based on user's team
  let poolToUse = '00'; // Default
  if (user) {
    const userGroups = user.groups || [];
    poolToUse = determinePoolForUser(user.id || user.email, userGroups);
  }

  // Retry logic for handling concurrent access
  const maxRetries = 5;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Try to update the counter atomically for this specific pool
      const counter = await prisma.runCounter.upsert({
        where: {
          year_pool: {
            year: currentYear,
            pool: poolToUse,
          },
        },
        update: {
          sequence: {
            increment: 1,
          },
          lastUsed: new Date(),
        },
        create: {
          year: currentYear,
          pool: poolToUse,
          sequence: 1,
          lastUsed: new Date(),
        },
      });

      // Format the sequence number with leading zeros (5 digits)
      const sequenceStr = counter.sequence.toString().padStart(5, '0');

      // Build the unique ID: WSRPT{POOL}-{SEQ}
      const uniqueId = `WSRPT${poolToUse}-${sequenceStr}`;

      return uniqueId;

    } catch (error) {
      // Handle unique constraint violations (rare race condition)
      if (error.code === 'P2002' && attempt < maxRetries - 1) {
        // Wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }

  throw new Error('Failed to generate unique run ID after multiple attempts');
}

/**
 * Gets statistics about run counter usage
 */
export async function getRunCounterStats(year = null) {
  const targetYear = year || new Date().getFullYear();

  const counters = await prisma.runCounter.findMany({
    where: { year: targetYear },
    orderBy: { pool: 'asc' },
  });

  const totalRuns = counters.reduce((sum, c) => sum + c.sequence, 0);

  return {
    year: targetYear,
    pools: counters.map(c => ({
      pool: c.pool,
      sequence: c.sequence,
      lastUsed: c.lastUsed,
    })),
    totalRuns,
  };
}

/**
 * Get pool assignment for a user (for display/testing purposes)
 */
export function getUserPool(user) {
  if (!user) return 'A';
  const userGroups = user.groups || [];
  return determinePoolForUser(user.id || user.email, userGroups);
}
