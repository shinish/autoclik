const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addConnectivityCatalog() {
  try {
    // Get the AWX environment
    const awxEnv = await prisma.awxEnvironment.findFirst();

    if (!awxEnv) {
      console.error('No AWX environment found');
      process.exit(1);
    }

    console.log('AWX Environment ID:', awxEnv.id);

    // Get a namespace (or create one)
    let namespace = await prisma.namespace.findFirst({
      where: { name: 'infrastructure' }
    });

    if (!namespace) {
      namespace = await prisma.namespace.create({
        data: {
          id: `ns-${Date.now()}`,
          name: 'infrastructure',
          description: 'Infrastructure monitoring and management'
        }
      });
      console.log('Created namespace:', namespace.id);
    } else {
      console.log('Using existing namespace:', namespace.id);
    }

    // Get the current user
    const user = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    if (!user) {
      console.error('No admin user found');
      process.exit(1);
    }

    console.log('Creating catalog for user:', user.email);

    // Check if catalog already exists
    const existingId = '069502287adeff1da8efbe880eb05068';
    const existing = await prisma.catalog.findUnique({
      where: { id: existingId }
    });

    if (existing) {
      console.log('Catalog already exists, updating...');
      await prisma.catalog.delete({
        where: { id: existingId }
      });
    }

    // Create the catalog entry
    const catalog = await prisma.catalog.create({
      data: {
        id: existingId,
        name: 'Server Connectivity Check',
        description: 'Check network connectivity from the AWX server to verify internet access and DNS resolution. Returns JSON artifacts with Success/Failed status for each host.',
        namespaceId: namespace.id,
        environmentId: awxEnv.id,
        templateId: '8',
        formSchema: JSON.stringify([
          {
            type: 'textarea',
            label: 'Target Hosts',
            key: 'check_hosts',
            required: true,
            placeholder: 'google.com\ngithub.com\n8.8.8.8',
            helpText: 'Enter one host per line (domains or IP addresses). Each host will be tested for HTTP/HTTPS connectivity.',
            defaultValue: 'google.com\ngithub.com\n8.8.8.8'
          },
          {
            type: 'number',
            label: 'Connection Timeout (seconds)',
            key: 'timeout',
            required: false,
            placeholder: '5',
            helpText: 'Maximum time to wait for each connection attempt',
            defaultValue: '5'
          },
          {
            type: 'text',
            label: 'Instance Group ID',
            key: 'instance_group_id',
            required: false,
            placeholder: '3',
            helpText: 'Optional: AWX instance group ID to run this job (e.g., 3 for Macbooks)',
            defaultValue: '3'
          }
        ]),
        createdBy: user.id
      }
    });

    console.log('✅ Catalog created successfully!');
    console.log('ID:', catalog.id);
    console.log('Name:', catalog.name);
    console.log('Template ID:', catalog.templateId);
    console.log('Namespace:', namespace.name);
    console.log('Environment:', awxEnv.name);

    // Create activity log
    await prisma.activity.create({
      data: {
        id: `activity-${Date.now()}`,
        action: 'created',
        entityType: 'catalog',
        entityId: catalog.id,
        entityName: catalog.name,
        performedBy: user.email,
        description: `Created catalog item: ${catalog.name}`
      }
    });

    console.log('✅ Activity log created');

  } catch (error) {
    console.error('Error creating catalog:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addConnectivityCatalog();
