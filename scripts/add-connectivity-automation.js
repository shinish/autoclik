const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addConnectivityAutomation() {
  try {
    // Get the current user (assuming admin user)
    const user = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    if (!user) {
      console.error('No admin user found');
      process.exit(1);
    }

    console.log(`Creating automation for user: ${user.email}`);

    // Check if automation already exists
    const existing = await prisma.automation.findFirst({
      where: { name: 'Server Connectivity Check' }
    });

    if (existing) {
      console.log('Automation already exists with ID:', existing.id);
      console.log('Deleting existing automation...');
      await prisma.automation.delete({
        where: { id: existing.id }
      });
    }

    // Create the automation
    const automation = await prisma.automation.create({
      data: {
        id: '069502287adeff1da8efbe880eb05069', // Unique ID
        name: 'Server Connectivity Check',
        namespace: 'infrastructure',
        description: 'Check network connectivity from the AWX server to verify internet access and DNS resolution. Returns JSON artifacts with Success/Failed status for each host.',
        keywords: JSON.stringify(['connectivity', 'network', 'ping', 'health', 'check', 'dns', 'http', 'https']),
        tags: JSON.stringify(['infrastructure', 'monitoring', 'network']),
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
          }
        ]),
        templateId: '8', // AWX job template ID for connectivity check
        customBody: JSON.stringify({
          extra_vars: {
            check_hosts: '{{form.check_hosts_array}}',
            timeout: '{{form.timeout}}'
          }
        }, null, 2),
        pinned: true,
        featured: true,
        runs: 0,
        createdBy: user.email
      }
    });

    console.log('✅ Automation created successfully!');
    console.log('ID:', automation.id);
    console.log('Name:', automation.name);
    console.log('Template ID:', automation.templateId);
    console.log('Namespace:', automation.namespace);

    // Create activity log
    await prisma.activity.create({
      data: {
        id: `activity-${Date.now()}`,
        action: 'created',
        entityType: 'automation',
        entityId: automation.id,
        entityName: automation.name,
        performedBy: user.email,
        description: `Created automation: ${automation.name}`,
        metadata: JSON.stringify({
          automationId: automation.id,
          automationName: automation.name,
          namespace: automation.namespace
        })
      }
    });

    console.log('✅ Activity log created');

  } catch (error) {
    console.error('Error creating automation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addConnectivityAutomation();
