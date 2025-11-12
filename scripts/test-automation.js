const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAutomation() {
  try {
    console.log('🧪 Testing Network Connectivity Automation...\n');

    // Get the automation
    const automation = await prisma.automation.findUnique({
      where: { name: 'Network Connectivity Test' },
    });

    if (!automation) {
      console.error('❌ Automation not found! Run configure-awx.js first.');
      return;
    }

    console.log('✅ Found automation:');
    console.log('   ID:', automation.id);
    console.log('   Name:', automation.name);
    console.log('   Template ID:', automation.templateId);
    console.log('   Namespace:', automation.namespace);

    // Simulate form submission
    const testParameters = {
      source_system: 'VRT-PDC',
      destn_ip: '10.118.234.75',
      ports_input: '9419'
    };

    console.log('\n📝 Test Parameters:');
    console.log(JSON.stringify(testParameters, null, 2));

    // Parse the custom body template
    const bodyTemplate = JSON.parse(automation.customBody);
    console.log('\n📦 Custom Body Template:');
    console.log(JSON.stringify(bodyTemplate, null, 2));

    // Simulate the replaceTemplateVariables function
    function replaceTemplateVariables(obj, parameters) {
      if (typeof obj === 'string') {
        const regex = /\{\{form\.(\w+)\}\}/g;
        return obj.replace(regex, (match, fieldName) => {
          return parameters[fieldName] !== undefined ? parameters[fieldName] : match;
        });
      } else if (Array.isArray(obj)) {
        return obj.map(item => replaceTemplateVariables(item, parameters));
      } else if (obj !== null && typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = replaceTemplateVariables(value, parameters);
        }
        return result;
      }
      return obj;
    }

    const requestBody = replaceTemplateVariables(bodyTemplate, testParameters);
    console.log('\n✨ Generated Request Body:');
    console.log(JSON.stringify(requestBody, null, 2));

    // Get AWX config
    const [urlSetting, tokenSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'default_api_endpoint' } }),
      prisma.setting.findUnique({ where: { key: 'awx_token' } }),
    ]);

    const awxUrl = urlSetting?.value || 'http://localhost:8080/api/v2';
    const awxToken = tokenSetting?.value || '';

    // Generate curl command
    const maskedToken = awxToken ? `${awxToken.substring(0, 8)}...` : '[TOKEN]';
    const endpoint = `${awxUrl}/job_templates/${automation.templateId}/launch/`;

    console.log('\n🌐 AWX Configuration:');
    console.log('   Base URL:', awxUrl);
    console.log('   Token:', maskedToken);
    console.log('   Endpoint:', endpoint);

    const curlCommand = `curl -X POST "${endpoint}" \\
  -H "Authorization: Bearer ${maskedToken}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(requestBody)}'`;

    console.log('\n📋 Generated cURL Command:');
    console.log(curlCommand);

    console.log('\n✅ Test completed successfully!');
    console.log('\n📌 Next Steps:');
    console.log(`   1. Start the dev server: npm run dev`);
    console.log(`   2. Navigate to: http://localhost:3000/catalog/${automation.id}/run`);
    console.log(`   3. Fill in the form with the test parameters`);
    console.log(`   4. Click "Run Automation"`);
    console.log(`   5. Click "Show More Information" to see the cURL command and request body`);

  } catch (error) {
    console.error('❌ Error testing automation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testAutomation();
