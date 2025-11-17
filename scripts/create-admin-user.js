const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Creating admin user account...\n');

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { samAccountName: 'admin' },
        { email: 'admin' }
      ]
    }
  });

  if (existingAdmin) {
    console.log('❌ Admin user already exists');
    console.log('Username:', existingAdmin.samAccountName);
    console.log('Email:', existingAdmin.email);
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'User',
      name: 'Admin User',
      samAccountName: 'admin',
      email: 'admin',
      password: hashedPassword,
      role: 'admin',
      enabled: true,
      locked: false,
      approved: true,
      approvedBy: 'system',
      approvedAt: new Date(),
    },
  });

  console.log('✓ Admin user created successfully!\n');
  console.log('User Details:');
  console.log('  Username:', adminUser.samAccountName);
  console.log('  Email:', adminUser.email);
  console.log('  Name:', adminUser.name);
  console.log('  Role:', adminUser.role);
  console.log('\n📋 Login Credentials:');
  console.log('  Username: admin');
  console.log('  Password: admin123');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
