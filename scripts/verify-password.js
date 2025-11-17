const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking admin password...\n');

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'shinish' },
        { samAccountName: 'shinish' }
      ]
    }
  });

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log('User found:');
  console.log('  Name:', user.name);
  console.log('  Username:', user.samAccountName);
  console.log('  Email:', user.email);
  console.log('  Password Hash:', user.password.substring(0, 20) + '...');

  // Test password
  const testPassword = 'P@ssw0rd';
  const isValid = await bcrypt.compare(testPassword, user.password);

  console.log('\nPassword Test:');
  console.log('  Testing with: P@ssw0rd');
  console.log('  Result:', isValid ? '✓ VALID' : '❌ INVALID');

  if (!isValid) {
    console.log('\n⚠️  Password mismatch! Updating password...');
    const newHash = await bcrypt.hash('P@ssw0rd', 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: newHash }
    });

    console.log('✓ Password updated to: P@ssw0rd');
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
