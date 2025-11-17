const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating admin username to lowercase...');
  
  const result = await prisma.user.update({
    where: {
      email: 'Shinish'
    },
    data: {
      samAccountName: 'shinish',
      email: 'shinish'
    }
  });
  
  console.log('✓ Updated admin user:');
  console.log('  Username:', result.samAccountName);
  console.log('  Email:', result.email);
  console.log('  Name:', result.name);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
