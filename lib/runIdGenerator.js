import prisma from '@/lib/prisma';

const POOLS = ['A', 'B', 'C', 'D', 'E'];

/**
 * Determines which pool (A-E) to use based on user's team/group
 * Each team gets assigned a consistent pool letter
 *
 * @param {string} userId - User ID or email
 * @param {Array} userGroups - User's group memberships
 * @returns {string} Pool letter (A-E)
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

  // Default fallback to pool A
  return 'A';
}

/**
 * Generates a unique run identifier in the format: TASK{YY}{POOL}{SEQ}i
 * Example: TASK25A0000000001i
 *
 * - TASK and i are static
 * - YY is the 2-digit year (e.g., 25 for 2025)
 * - POOL is determined by user's team (A-E)
 * - SEQ is a 10-digit sequential number per pool
 *
 * Pool assignment:
 * - Each team/group gets assigned a consistent pool letter (A-E)
 * - Users in the same team will always use the same pool
 * - Sequence numbers increment independently per pool
 *
 * @param {Object} user - User object with id, email, and groups
 * @returns {Promise<string>} Unique run ID
 */
export async function generateUniqueRunId(user = null) {
  const currentYear = new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2); // Last 2 digits (e.g., "25")

  // Determine which pool to use based on user's team
  let poolToUse = 'A'; // Default
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

      // Format the sequence number with leading zeros (10 digits)
      const sequenceStr = counter.sequence.toString().padStart(10, '0');

      // Build the unique ID: TASK{YY}{POOL}{SEQ}i
      const uniqueId = `TASK${yearSuffix}${poolToUse}${sequenceStr}i`;

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
