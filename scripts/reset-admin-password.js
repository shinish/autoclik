const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Resetting admin password...\n');

  // Hash the new password
  const newPassword = '3Mergency!';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update the admin user
  const updatedUser = await prisma.user.update({
    where: {
      email: 'shinish'
    },
    data: {
      password: hashedPassword,
      approved: true,
      approvedBy: 'system',
      approvedAt: new Date(),
      enabled: true,
      locked: false
    }
  });

  console.log('✓ Admin password reset successfully!');
  console.log('\nAdmin User Details:');
  console.log('  Username:', updatedUser.samAccountName);
  console.log('  Email:', updatedUser.email);
  console.log('  Name:', updatedUser.name);
  console.log('  Role:', updatedUser.role);
  console.log('  Enabled:', updatedUser.enabled);
  console.log('  Locked:', updatedUser.locked);
  console.log('  Approved:', updatedUser.approved);
  console.log('\n📋 New Login Credentials:');
  console.log('  Username: shinish');
  console.log('  Password: 3Mergency!');

  // Verify the password works
  const isValid = await bcrypt.compare(newPassword, updatedUser.password);
  console.log('\n✓ Password verification:', isValid ? 'PASSED' : 'FAILED');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
