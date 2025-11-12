const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function configureAwx() {
  try {
    console.log('🔧 Configuring AWX settings...\n');

    // Step 1: Update AWX settings
    const awxBaseUrl = 'http://localhost:8080/api/v2';
    const awxToken = 'vOlNLjf2PVxeEnPmBDpBAsUymWo68Z';

    await prisma.setting.upsert({
      where: { key: 'default_api_endpoint' },
      update: { value: awxBaseUrl },
      create: { key: 'default_api_endpoint', value: awxBaseUrl },
    });
    console.log('✅ Set AWX Base URL:', awxBaseUrl);

    await prisma.setting.upsert({
      where: { key: 'awx_token' },
      update: { value: awxToken },
      create: { key: 'awx_token', value: awxToken },
    });
    console.log('✅ Set AWX Token:', awxToken.substring(0, 8) + '...\n');

    // Step 2: Create or update automation
    const templateId = '12';
    const automationName = 'Network Connectivity Test';
    const automationDescription = 'Test network connectivity from source system to destination IP and ports';

    // Form schema for the automation
    const formSchema = [
      {
        key: 'source_system',
        label: 'Source System',
        type: 'text',
        placeholder: 'e.g., VRT-PDC',
        required: true,
        helpText: 'Enter the source system identifier',
        defaultValue: 'VRT-PDC'
      },
      {
        key: 'destn_ip',
        label: 'Destination IP',
        type: 'text',
        placeholder: 'e.g., 10.118.234.75',
        required: true,
        helpText: 'Enter the destination IP address'
      },
      {
        key: 'ports_input',
        label: 'Ports',
        type: 'text',
        placeholder: 'e.g., 9419',
        required: true,
        helpText: 'Enter the port number(s) to test'
      }
    ];

    // Custom body template with instance_groups and extra_vars
    const customBody = {
      instance_groups: [2],
      extra_vars: {
        source_system: ['{{form.source_system}}'],
        destn_ip: '{{form.destn_ip}}',
        ports_input: '{{form.ports_input}}'
      }
    };

    const automation = await prisma.automation.upsert({
      where: { name: automationName },
      update: {
        templateId: templateId,
        description: automationDescription,
        formSchema: JSON.stringify(formSchema),
        customBody: JSON.stringify(customBody),
        namespace: 'Network',
      },
      create: {
        templateId: templateId,
        name: automationName,
        description: automationDescription,
        formSchema: JSON.stringify(formSchema),
        customBody: JSON.stringify(customBody),
        namespace: 'Network',
        runs: 0,
        createdBy: 'system',
      },
    });

    console.log('✅ Created/Updated Automation:');
    console.log('   - Name:', automation.name);
    console.log('   - Template ID:', automation.templateId);
    console.log('   - Automation ID:', automation.id);
    console.log('   - Namespace:', automation.namespace);
    console.log('\n📋 Form Fields:');
    formSchema.forEach(field => {
      console.log(`   - ${field.label} (${field.key}): ${field.type}`);
    });

    console.log('\n📦 Custom Body Structure:');
    console.log(JSON.stringify(customBody, null, 2));

    console.log('\n✨ Configuration complete!');
    console.log('\nYou can now run this automation from:');
    console.log(`   http://localhost:3000/catalog/${automation.id}/run`);

    console.log('\n📝 Example values:');
    console.log('   - Source System: VRT-PDC');
    console.log('   - Destination IP: 10.118.234.75');
    console.log('   - Ports: 9419');

    console.log('\n🎯 This will generate the curl command:');
    console.log(`curl -X POST "http://localhost:8080/api/v2/job_templates/12/launch/" \\
  -H "Authorization: Bearer vOlNLjf2..." \\
  -H "Content-Type: application/json" \\
  -d '{
  "instance_groups": [2],
  "extra_vars": {
    "source_system": ["VRT-PDC"],
    "destn_ip": "10.118.234.75",
    "ports_input": "9419"
  }
}'`);

  } catch (error) {
    console.error('❌ Error configuring AWX:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

configureAwx();
