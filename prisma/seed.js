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

  // Create basic system settings (check if they exist first)
  const settingsToCreate = [
    { key: 'default_api_endpoint', value: '', description: 'Default AWX API endpoint' },
    { key: 'awx_token', value: '', description: 'AWX API Token for authentication' },
    { key: 'proxy_enabled', value: 'false', description: 'Enable proxy for API requests' },
    { key: 'proxy_url', value: '', description: 'Proxy server URL' },
    { key: 'proxy_port', value: '', description: 'Proxy server port' },
    { key: 'first_time_setup', value: 'true', description: 'Flag to indicate if this is the first time setup' },
  ];

  for (const setting of settingsToCreate) {
    const existing = await prisma.setting.findUnique({ where: { key: setting.key } });
    if (!existing) {
      await prisma.setting.create({ data: setting });
    }
  }

  // Create 5 test groups
  console.log('Creating test groups...');
  const groups = [];

  groups.push(await prisma.group.create({
    data: {
      name: 'IT Operations',
      description: 'IT operations team responsible for infrastructure and deployments',
      isPredefined: false,
    },
  }));

  groups.push(await prisma.group.create({
    data: {
      name: 'Database Admins',
      description: 'Database administrators managing SQL and NoSQL databases',
      isPredefined: false,
    },
  }));

  groups.push(await prisma.group.create({
    data: {
      name: 'Security Team',
      description: 'Security team managing access control and compliance',
      isPredefined: false,
    },
  }));

  groups.push(await prisma.group.create({
    data: {
      name: 'Network Engineers',
      description: 'Network engineering team managing network infrastructure',
      isPredefined: false,
    },
  }));

  groups.push(await prisma.group.create({
    data: {
      name: 'DevOps Team',
      description: 'DevOps team managing CI/CD pipelines and automation',
      isPredefined: false,
    },
  }));

  console.log(`Created ${groups.length} test groups`);

  // Create 5 test users
  console.log('Creating test users...');
  const testUsers = [];
  const testPassword = await bcrypt.hash('password123', 10);

  testUsers.push(await prisma.user.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
      samAccountName: 'johndoe',
      email: 'john.doe@company.com',
      password: testPassword,
      role: 'user',
      enabled: true,
      locked: false,
      department: 'IT Operations',
      location: 'New York',
    },
  }));

  testUsers.push(await prisma.user.create({
    data: {
      firstName: 'Sarah',
      lastName: 'Smith',
      name: 'Sarah Smith',
      samAccountName: 'sarahsmith',
      email: 'sarah.smith@company.com',
      password: testPassword,
      role: 'user',
      enabled: true,
      locked: false,
      department: 'Database Administration',
      location: 'San Francisco',
    },
  }));

  testUsers.push(await prisma.user.create({
    data: {
      firstName: 'Michael',
      lastName: 'Johnson',
      name: 'Michael Johnson',
      samAccountName: 'michaelj',
      email: 'michael.johnson@company.com',
      password: testPassword,
      role: 'user',
      enabled: true,
      locked: false,
      department: 'Security',
      location: 'Austin',
    },
  }));

  testUsers.push(await prisma.user.create({
    data: {
      firstName: 'Emily',
      lastName: 'Davis',
      name: 'Emily Davis',
      samAccountName: 'emilyd',
      email: 'emily.davis@company.com',
      password: testPassword,
      role: 'user',
      enabled: true,
      locked: false,
      department: 'Network Engineering',
      location: 'Seattle',
    },
  }));

  testUsers.push(await prisma.user.create({
    data: {
      firstName: 'David',
      lastName: 'Wilson',
      name: 'David Wilson',
      samAccountName: 'davidw',
      email: 'david.wilson@company.com',
      password: testPassword,
      role: 'user',
      enabled: true,
      locked: false,
      department: 'DevOps',
      location: 'Boston',
    },
  }));

  console.log(`Created ${testUsers.length} test users`);
  console.log('Test user credentials: username@company.com / password123');

  // Assign users to groups
  console.log('Assigning users to groups...');
  await prisma.groupMember.create({
    data: { userId: testUsers[0].id, groupId: groups[0].id },
  });
  await prisma.groupMember.create({
    data: { userId: testUsers[1].id, groupId: groups[1].id },
  });
  await prisma.groupMember.create({
    data: { userId: testUsers[2].id, groupId: groups[2].id },
  });
  await prisma.groupMember.create({
    data: { userId: testUsers[3].id, groupId: groups[3].id },
  });
  await prisma.groupMember.create({
    data: { userId: testUsers[4].id, groupId: groups[4].id },
  });

  // Create 5 test credentials
  console.log('Creating test credentials...');
  const credentials = [];

  credentials.push(await prisma.credential.create({
    data: {
      name: 'Production SSH Key',
      description: 'SSH key for production servers',
      credentialType: 'machine',
      username: 'ansible',
      password: await bcrypt.hash('prod-password-123', 10),
      createdBy: 'admin',
    },
  }));

  credentials.push(await prisma.credential.create({
    data: {
      name: 'AWS Cloud Credentials',
      description: 'AWS access credentials for cloud automation',
      credentialType: 'cloud',
      username: 'AKIAIOSFODNN7EXAMPLE',
      password: await bcrypt.hash('wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', 10),
      createdBy: 'admin',
    },
  }));

  credentials.push(await prisma.credential.create({
    data: {
      name: 'Database Admin',
      description: 'PostgreSQL database administrator credentials',
      credentialType: 'machine',
      username: 'dbadmin',
      password: await bcrypt.hash('db-secure-pass-456', 10),
      createdBy: 'admin',
    },
  }));

  credentials.push(await prisma.credential.create({
    data: {
      name: 'Network Device SSH',
      description: 'SSH credentials for network switches and routers',
      credentialType: 'network',
      username: 'netadmin',
      password: await bcrypt.hash('network-pass-789', 10),
      createdBy: 'admin',
    },
  }));

  credentials.push(await prisma.credential.create({
    data: {
      name: 'Ansible Vault Password',
      description: 'Vault password for encrypted Ansible variables',
      credentialType: 'vault',
      vaultPassword: await bcrypt.hash('vault-secret-key-999', 10),
      createdBy: 'admin',
    },
  }));

  console.log(`Created ${credentials.length} test credentials`);

  // Create test activity logs
  console.log('Creating test activity logs...');
  const activities = [];

  activities.push(await prisma.activity.create({
    data: {
      action: 'created',
      entityType: 'user',
      entityId: testUsers[0].id,
      entityName: testUsers[0].name,
      description: 'User account created',
      performedBy: 'admin',
      metadata: JSON.stringify({ department: 'IT Operations', location: 'New York' }),
    },
  }));

  activities.push(await prisma.activity.create({
    data: {
      action: 'created',
      entityType: 'group',
      entityId: groups[0].id,
      entityName: groups[0].name,
      description: 'Group created for IT Operations team',
      performedBy: 'admin',
      metadata: JSON.stringify({ memberCount: 1 }),
    },
  }));

  activities.push(await prisma.activity.create({
    data: {
      action: 'created',
      entityType: 'credential',
      entityId: credentials[0].id,
      entityName: credentials[0].name,
      description: 'SSH credential created for production servers',
      performedBy: 'admin',
      metadata: JSON.stringify({ credentialType: 'machine' }),
    },
  }));

  activities.push(await prisma.activity.create({
    data: {
      action: 'updated',
      entityType: 'user',
      entityId: testUsers[1].id,
      entityName: testUsers[1].name,
      description: 'User profile updated',
      performedBy: 'admin',
      metadata: JSON.stringify({ changes: ['department', 'location'] }),
    },
  }));

  activities.push(await prisma.activity.create({
    data: {
      action: 'executed',
      entityType: 'automation',
      entityId: 'auto-test-001',
      entityName: 'Server Health Check',
      description: 'Automation executed successfully',
      performedBy: testUsers[0].email,
      metadata: JSON.stringify({ status: 'success', duration: '45s', servers: 12 }),
    },
  }));

  activities.push(await prisma.activity.create({
    data: {
      action: 'executed',
      entityType: 'automation',
      entityId: 'auto-test-002',
      entityName: 'Database Backup',
      description: 'Automation executed with warnings',
      performedBy: testUsers[1].email,
      metadata: JSON.stringify({ status: 'success', duration: '2m 15s', warnings: ['Slow response from replica'] }),
    },
  }));

  activities.push(await prisma.activity.create({
    data: {
      action: 'created',
      entityType: 'group',
      entityId: groups[2].id,
      entityName: groups[2].name,
      description: 'Security team group created',
      performedBy: 'admin',
      metadata: JSON.stringify({ memberCount: 1, permissions: ['read', 'write', 'execute'] }),
    },
  }));

  activities.push(await prisma.activity.create({
    data: {
      action: 'deleted',
      entityType: 'credential',
      entityId: 'cred-old-001',
      entityName: 'Old SSH Key',
      description: 'Deprecated SSH credential removed',
      performedBy: 'admin',
      metadata: JSON.stringify({ reason: 'Key rotation', replaced_by: credentials[0].id }),
    },
  }));

  console.log(`Created ${activities.length} test activity logs`);

  console.log('\n=== Database seeded successfully! ===');
  console.log('\nTest Accounts Created:');
  console.log('  Admin: admin / admin123');
  console.log('  Users: [firstname].[lastname]@company.com / password123');
  console.log('\nTest Data Summary:');
  console.log(`  - Groups: ${groups.length}`);
  console.log(`  - Users: ${testUsers.length}`);
  console.log(`  - Credentials: ${credentials.length}`);
  console.log(`  - Activity Logs: ${activities.length}`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
