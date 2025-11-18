const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedNamespace() {
  try {
    console.log('📂 Adding default namespaces...');

    const namespaces = [
      {
        name: 'default',
        displayName: 'Default',
        description: 'Default namespace for general automation tasks',
        color: '#3b82f6',
        icon: 'folder',
      },
      {
        name: 'infrastructure',
        displayName: 'Infrastructure',
        description: 'Infrastructure automation and management',
        color: '#8b5cf6',
        icon: 'server',
      },
      {
        name: 'deployment',
        displayName: 'Deployment',
        description: 'Application deployment and CI/CD tasks',
        color: '#10b981',
        icon: 'rocket',
      },
      {
        name: 'monitoring',
        displayName: 'Monitoring',
        description: 'Monitoring and alerting automation',
        color: '#f59e0b',
        icon: 'activity',
      },
    ];

    for (const ns of namespaces) {
      const existing = await prisma.namespace.findUnique({
        where: { name: ns.name },
      });

      if (existing) {
        console.log(`✓ Namespace already exists: ${ns.displayName}`);
      } else {
        const created = await prisma.namespace.create({
          data: {
            ...ns,
            createdBy: 'system',
          },
        });
        console.log(`✓ Created namespace: ${created.displayName} (${created.name})`);
      }
    }

    console.log('\n✅ Namespace seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding namespaces:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedNamespace()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Namespace seeding failed:', error);
    process.exit(1);
  });
