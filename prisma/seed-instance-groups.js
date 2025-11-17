const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedInstanceGroups() {
  console.log('Seeding instance groups...');

  try {
    // Create default instance groups
    const defaultGroups = [
      {
        name: 'default',
        description: 'Default instance group for all automations',
        enabled: true,
        createdBy: 'system',
      },
      {
        name: 'production',
        description: 'Production instance group for critical automations',
        enabled: true,
        createdBy: 'system',
      },
      {
        name: 'development',
        description: 'Development instance group for testing',
        enabled: true,
        createdBy: 'system',
      },
    ];

    for (const group of defaultGroups) {
      // Check if instance group already exists
      const existing = await prisma.instanceGroup.findUnique({
        where: { name: group.name },
      });

      if (!existing) {
        await prisma.instanceGroup.create({
          data: group,
        });
        console.log(`✅ Created instance group: ${group.name}`);
      } else {
        console.log(`⏭️  Instance group already exists: ${group.name}`);
      }
    }

    console.log('Instance groups seeded successfully!');
  } catch (error) {
    console.error('Error seeding instance groups:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedInstanceGroups();
