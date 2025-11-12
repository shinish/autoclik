import prisma from './prisma';

/**
 * Log an activity to the Activity table
 * @param {Object} params
 * @param {string} params.action - created, updated, deleted, executed
 * @param {string} params.entityType - automation, schedule, namespace, user, etc.
 * @param {string} params.entityId - ID of the entity
 * @param {string} params.entityName - Name of the entity
 * @param {string} params.performedBy - Username or user ID
 * @param {string} [params.description] - Optional description
 * @param {Object} [params.metadata] - Optional metadata object
 */
export async function logActivity({
  action,
  entityType,
  entityId,
  entityName,
  performedBy,
  description,
  metadata,
}) {
  try {
    await prisma.activity.create({
      data: {
        action,
        entityType,
        entityId,
        entityName,
        description,
        performedBy,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - logging activity should not break the main operation
  }
}
