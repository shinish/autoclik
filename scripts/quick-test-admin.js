const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('\n✓ Testing Default Admin Account: admin / admin123\n');

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'admin' },
        { samAccountName: 'admin' }
      ]
    }
  });

  if (!user) {
    console.log('❌ Admin user not found!');
    return;
  }

  const isValid = await bcrypt.compare('admin123', user.password);

  console.log('Account Status:');
  console.log('  ✓ User exists');
  console.log('  ✓ Username:', user.samAccountName);
  console.log('  ✓ Name:', user.name);
  console.log('  ✓ Role:', user.role);
  console.log('  ✓ Enabled:', user.enabled);
  console.log('  ✓ Approved:', user.approved);
  console.log('  ✓ Password valid:', isValid);

  if (user.role === 'admin' && user.enabled && user.approved && isValid) {
    console.log('\n✅ Admin account is ready to use!');
    console.log('\nLogin at: http://localhost:3000/login');
    console.log('  Username: admin');
    console.log('  Password: admin123\n');
  } else {
    console.log('\n❌ Admin account has issues!');
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
