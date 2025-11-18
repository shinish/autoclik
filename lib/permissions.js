/**
 * Check if a user has permission to access a catalog based on namespace permissions
 * @param {string} userEmail - User's email
 * @param {string} namespaceId - Namespace ID to check
 * @param {string} permission - Permission type: 'read', 'write', 'execute', 'admin'
 * @returns {Promise<boolean>} - Whether user has permission
 */
export async function checkCatalogPermission(userEmail, namespaceId, permission = 'read') {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Get user with permissions
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        groupMemberships: {
          include: {
            group: {
              include: {
                permissions: {
                  where: { namespaceId },
                },
              },
            },
          },
        },
        permissions: {
          where: { namespaceId },
        },
      },
    });

    if (!user) {
      await prisma.$disconnect();
      return false;
    }

    // Admins have all permissions
    if (user.role === 'admin') {
      await prisma.$disconnect();
      return true;
    }

    // Map permission string to database field
    const permissionMap = {
      read: 'canRead',
      write: 'canWrite',
      execute: 'canExecute',
      admin: 'canAdmin',
    };

    const permField = permissionMap[permission] || 'canRead';

    // Check direct user permissions
    const hasDirectPermission = user.permissions.some(p => p[permField]);
    if (hasDirectPermission) {
      await prisma.$disconnect();
      return true;
    }

    // Check group permissions
    const hasGroupPermission = user.groupMemberships.some(membership =>
      membership.group.permissions.some(p => p[permField])
    );

    await prisma.$disconnect();
    return hasGroupPermission;
  } catch (error) {
    console.error('Error checking catalog permission:', error);
    return false;
  }
}

/**
 * Get all namespace IDs that a user has access to
 * @param {string} userEmail - User's email
 * @param {string} permission - Permission type
 * @returns {Promise<string[]>} - Array of namespace IDs
 */
export async function getUserAccessibleNamespaces(userEmail, permission = 'read') {
  try {
    const { PrismaClient} = await import('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        groupMemberships: {
          include: {
            group: {
              include: {
                permissions: true,
              },
            },
          },
        },
        permissions: true,
      },
    });

    if (!user) {
      await prisma.$disconnect();
      return [];
    }

    // Admins have access to all namespaces
    if (user.role === 'admin') {
      const allNamespaces = await prisma.namespace.findMany({
        select: { id: true },
      });
      await prisma.$disconnect();
      return allNamespaces.map(ns => ns.id);
    }

    const permissionMap = {
      read: 'canRead',
      write: 'canWrite',
      execute: 'canExecute',
      admin: 'canAdmin',
    };

    const permField = permissionMap[permission] || 'canRead';
    const namespaceIds = new Set();

    // Add from direct permissions
    user.permissions
      .filter(p => p[permField])
      .forEach(p => namespaceIds.add(p.namespaceId));

    // Add from group permissions
    user.groupMemberships.forEach(membership => {
      membership.group.permissions
        .filter(p => p[permField])
        .forEach(p => namespaceIds.add(p.namespaceId));
    });

    await prisma.$disconnect();
    return Array.from(namespaceIds);
  } catch (error) {
    console.error('Error getting accessible namespaces:', error);
    return [];
  }
}
