const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Debugging admin accounts...\n');

  const adminAccounts = ['admin', 'shinish'];

  for (const username of adminAccounts) {
    console.log(`Checking: ${username}`);
    console.log('='.repeat(60));

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: username },
          { samAccountName: username }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        samAccountName: true,
        email: true,
        password: true,
        role: true,
        enabled: true,
        locked: true,
        approved: true,
        approvedBy: true,
        approvedAt: true,
      }
    });

    if (!user) {
      console.log('❌ User not found!\n');
      continue;
    }

    console.log('User Details:');
    console.log('  ID:', user.id);
    console.log('  Name:', user.name);
    console.log('  First Name:', user.firstName);
    console.log('  Last Name:', user.lastName);
    console.log('  Username (samAccountName):', user.samAccountName);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Enabled:', user.enabled);
    console.log('  Locked:', user.locked);
    console.log('  Approved:', user.approved);
    console.log('  Approved By:', user.approvedBy);
    console.log('  Approved At:', user.approvedAt);
    console.log('  Password Hash (first 30):', user.password.substring(0, 30) + '...');

    // Test passwords
    const passwords = {
      'admin': 'admin123',
      'shinish': '3Mergency!'
    };

    const testPassword = passwords[username];
    const isValid = await bcrypt.compare(testPassword, user.password);

    console.log('\nPassword Test:');
    console.log('  Testing with:', testPassword);
    console.log('  Result:', isValid ? '✓ VALID' : '❌ INVALID');
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
