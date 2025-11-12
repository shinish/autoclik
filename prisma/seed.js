const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Check if any users exist
  const userCount = await prisma.user.count();

  if (userCount === 0) {
    console.log('No users found. Creating default admin user...');

    // Hash password for admin user (password: admin123)
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create default admin user
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
      },
    });

    console.log('Default admin account created:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
  } else {
    console.log(`Found ${userCount} existing user(s). Skipping admin user creation.`);
  }

  // Create basic system settings
  await prisma.setting.create({
    data: {
      key: 'default_api_endpoint',
      value: '',
      description: 'Default AWX API endpoint',
    },
  });

  await prisma.setting.create({
    data: {
      key: 'awx_token',
      value: '',
      description: 'AWX API Token for authentication',
    },
  });

  await prisma.setting.create({
    data: {
      key: 'proxy_enabled',
      value: 'false',
      description: 'Enable proxy for API requests',
    },
  });

  await prisma.setting.create({
    data: {
      key: 'proxy_url',
      value: '',
      description: 'Proxy server URL',
    },
  });

  await prisma.setting.create({
    data: {
      key: 'proxy_port',
      value: '',
      description: 'Proxy server port',
    },
  });

  // Add first-time setup flag
  await prisma.setting.create({
    data: {
      key: 'first_time_setup',
      value: 'true',
      description: 'Flag to indicate if this is the first time setup',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
