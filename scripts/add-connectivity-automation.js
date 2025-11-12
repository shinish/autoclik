const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Creating Connectivity Check automation...');

  // Create the automation with the exact custom body from test.txt
  const automation = await prisma.automation.create({
    data: {
      name: 'Port Connectivity Check',
      namespace: 'infra',
      description: 'Test network connectivity to destination IP and ports',
      keywords: JSON.stringify(['connectivity', 'network', 'port', 'test']),
      tags: JSON.stringify(['network', 'connectivity']),

      // Form schema - defines the UI form fields
      formSchema: JSON.stringify([
        {
          type: 'text',
          label: 'Source System',
          key: 'source_system',
          required: true,
          placeholder: 'VRT-PDC',
          helpText: 'Source system identifier'
        },
        {
          type: 'text',
          label: 'Destination IP',
          key: 'destn_ip',
          required: true,
          placeholder: '10.118.234.75',
          helpText: 'IP address to test connectivity'
        },
        {
          type: 'text',
          label: 'Ports',
          key: 'ports_input',
          required: true,
          placeholder: '9419',
          helpText: 'Port numbers to test (comma-separated for multiple)'
        }
      ]),

      templateId: 'your-template-id-here', // Replace with your AWX template ID
      inventoryId: null, // Not needed if instance_groups is used

      // Custom body - exact structure from test.txt with template variables
      customBody: JSON.stringify({
        instance_groups: [298],
        extra_vars: {
          source_system: ['{{form.source_system}}'],
          destn_ip: '{{form.destn_ip}}',
          ports_input: '{{form.ports_input}}'
        }
      }),

      pinned: true,
      featured: true,
      createdBy: 'admin@example.com',
    },
  });

  console.log('✅ Automation created successfully!');
  console.log('\nAutomation Details:');
  console.log('-------------------');
  console.log('ID:', automation.id);
  console.log('Name:', automation.name);
  console.log('\nCustom Body:');
  console.log(JSON.stringify(JSON.parse(automation.customBody), null, 2));
  console.log('\nForm Schema:');
  console.log(JSON.stringify(JSON.parse(automation.formSchema), null, 2));
  console.log('\n📝 To use this automation:');
  console.log('1. Go to http://localhost:3000/catalog');
  console.log('2. Find "Port Connectivity Check"');
  console.log('3. Click to run it');
  console.log('4. Fill in the form with your values');
  console.log('5. Execute!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
