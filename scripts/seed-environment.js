const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function seedEnvironment() {
  try {
    console.log('🌍 Adding AWX environment from .env configuration...');

    const awxBaseUrl = process.env.AWX_BASE_URL || 'http://localhost:8080/api/v2';
    const awxToken = process.env.AWX_TOKEN || '';

    // Remove /api/v2 from the base URL if present
    const baseUrl = awxBaseUrl.replace('/api/v2', '').replace('/api/v2/', '');

    // Check if environment already exists
    const existingEnv = await prisma.awxEnvironment.findFirst({
      where: { baseUrl },
    });

    if (existingEnv) {
      console.log(`✓ Environment already exists: ${existingEnv.name}`);
      console.log(`  URL: ${existingEnv.baseUrl}`);
      console.log(`  ID: ${existingEnv.id}`);
      return existingEnv;
    }

    // Create new environment
    const environment = await prisma.awxEnvironment.create({
      data: {
        name: 'Local AWX',
        baseUrl: baseUrl,
        token: awxToken,
        description: 'Local AWX environment running on this server',
      },
    });

    console.log('✓ AWX Environment created successfully!');
    console.log(`  Name: ${environment.name}`);
    console.log(`  URL: ${environment.baseUrl}`);
    console.log(`  ID: ${environment.id}`);
    console.log(`  Token: ${awxToken ? awxToken.substring(0, 10) + '...' : 'Not set'}`);

    return environment;
  } catch (error) {
    console.error('❌ Error seeding environment:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedEnvironment()
  .then(() => {
    console.log('\n✅ Environment seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Environment seeding failed:', error);
    process.exit(1);
  });
