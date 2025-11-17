const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating existing users to approved status...');
  
  // Update all existing users to approved=true
  const result = await prisma.user.updateMany({
    where: {},
    data: {
      approved: true,
      approvedBy: 'system',
      approvedAt: new Date(),
    },
  });
  
  console.log(`✓ Updated ${result.count} users to approved status`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
