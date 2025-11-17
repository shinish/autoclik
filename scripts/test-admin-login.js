const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing admin account logins...\n');

  const adminAccounts = [
    { username: 'shinish', password: '3Mergency!' },
    { username: 'admin', password: 'admin123' }
  ];

  for (const account of adminAccounts) {
    console.log(`Testing: ${account.username}`);

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: account.username },
          { samAccountName: account.username }
        ]
      }
    });

    if (!user) {
      console.log(`  ❌ User not found\n`);
      continue;
    }

    // Verify password
    const isValid = await bcrypt.compare(account.password, user.password);

    console.log(`  Username: ${user.samAccountName}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Approved: ${user.approved}`);
    console.log(`  Enabled: ${user.enabled}`);
    console.log(`  Password Valid: ${isValid ? '✓ YES' : '❌ NO'}`);
    console.log('');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
