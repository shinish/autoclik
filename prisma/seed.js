const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Check if any users exist
  const userCount = await prisma.user.count();

  if (userCount === 0) {
    console.log('No users found. Creating default admin users...');

    // Create default admin accounts
    const adminAccounts = [
      {
        firstName: 'Shinish',
        lastName: 'Sasidharan',
        name: 'Shinish Sasidharan',
        samAccountName: 'shinish',
        email: 'shinish',
        password: '3Mergency!',
      },
      {
        firstName: 'Admin',
        lastName: 'User',
        name: 'Admin User',
        samAccountName: 'admin',
        email: 'admin',
        password: 'admin123',
      },
    ];

    for (const account of adminAccounts) {
      const hashedPassword = await bcrypt.hash(account.password, 10);

      await prisma.user.create({
        data: {
          firstName: account.firstName,
          lastName: account.lastName,
          name: account.name,
          samAccountName: account.samAccountName,
          email: account.email,
          password: hashedPassword,
          role: 'admin',
          enabled: true,
          locked: false,
          approved: true,
          approvedBy: 'system',
          approvedAt: new Date(),
        },
      });

      console.log(`✓ Admin account created: ${account.samAccountName} / ${account.password}`);
    }
  } else {
    console.log(`Found ${userCount} existing user(s). Checking for default admin accounts...`);

    // Check if default admin accounts exist, create them if not
    const defaultAdmins = [
      { username: 'shinish', password: '3Mergency!', firstName: 'Shinish', lastName: 'Sasidharan' },
      { username: 'admin', password: 'admin123', firstName: 'Admin', lastName: 'User' },
    ];

    for (const admin of defaultAdmins) {
      const existingAdmin = await prisma.user.findFirst({
        where: {
          OR: [
            { samAccountName: admin.username },
            { email: admin.username }
          ]
        }
      });

      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(admin.password, 10);

        await prisma.user.create({
          data: {
            firstName: admin.firstName,
            lastName: admin.lastName,
            name: `${admin.firstName} ${admin.lastName}`,
            samAccountName: admin.username,
            email: admin.username,
            password: hashedPassword,
            role: 'admin',
            enabled: true,
            locked: false,
            approved: true,
            approvedBy: 'system',
            approvedAt: new Date(),
          },
        });

        console.log(`✓ Created missing admin account: ${admin.username} / ${admin.password}`);
      } else {
        // Ensure default admin accounts are always approved and enabled
        if (!existingAdmin.approved || !existingAdmin.enabled || existingAdmin.locked || existingAdmin.role !== 'admin') {
          await prisma.user.update({
            where: { id: existingAdmin.id },
            data: {
              approved: true,
              approvedBy: 'system',
              approvedAt: new Date(),
              enabled: true,
              locked: false,
              role: 'admin',
            },
          });
          console.log(`✓ Updated admin account to approved/enabled: ${admin.username}`);
        }
      }
    }
  }

  // Create basic system settings (check if they exist first)
  const settingsToCreate = [
    { key: 'default_api_endpoint', value: '', description: 'Default AWX API endpoint' },
    { key: 'awx_token', value: '', description: 'AWX API Token for authentication' },
    { key: 'proxy_enabled', value: 'false', description: 'Enable proxy for API requests' },
    { key: 'proxy_url', value: '', description: 'Proxy server URL' },
    { key: 'proxy_port', value: '', description: 'Proxy server port' },
    { key: 'first_time_setup', value: 'true', description: 'Flag to indicate if this is the first time setup' },
    // AWX Connectivity Check settings
    { key: 'connectivity_check_template_id', value: '1456', description: 'AWX Job Template ID for connectivity checks' },
    { key: 'default_instance_group_id', value: '', description: 'Default AWX Instance Group ID for jobs' },
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

  // Create 5 test automations (catalog items)
  console.log('Creating test catalog items...');
  const automations = [];

  /* Temporarily disabled - will be fixed in next update

  automations.push(await prisma.automation.create({
    data: {
      name: 'Server Health Check',
      namespace: 'Production',
      description: 'Automated health check for all production servers',
      keywords: JSON.stringify(['monitoring', 'health', 'servers']),
      tags: JSON.stringify(['monitoring', 'health', 'production']),
      formSchema: JSON.stringify({
        fields: [
          { id: 'servers', label: 'Target Servers', type: 'text', placeholder: 'server1,server2', required: true },
          { id: 'check_type', label: 'Check Type', type: 'select', options: ['Full', 'Quick', 'Network'], required: true }
        ]
      }),
      templateId: '101',
      customBody: JSON.stringify({
        inventory: 'prod-servers',
        extra_vars: { servers: '{{form.servers}}', check_type: '{{form.check_type}}' }
      }),
      createdBy: 'Shinish',
      pinned: true,
    },
  }));

  automations.push(await prisma.automation.create({
    data: {
      name: 'Deploy Application to Environment',
      description: 'Deploy application code to specified environment',
      category: 'Deployment',
      namespace: 'DevOps',
      tags: ['deployment', 'ci/cd', 'automation'],
      icon: 'Upload',
      formSchema: JSON.stringify({
        fields: [
          { id: 'app_name', label: 'Application Name', type: 'text', required: true },
          { id: 'environment', label: 'Environment', type: 'select', options: ['dev', 'staging', 'production'], required: true },
          { id: 'version', label: 'Version', type: 'text', placeholder: 'v1.0.0', required: true }
        ]
      }),
      templateId: '102',
      awxJobTemplateId: '102',
      customBody: JSON.stringify({
        inventory: 'deployment-servers',
        extra_vars: { app_name: '{{form.app_name}}', environment: '{{form.environment}}', version: '{{form.version}}' }
      }),
      createdBy: 'admin',
      enabled: true,
    },
  }));

  automations.push(await prisma.automation.create({
    data: {
      name: 'Backup Database to S3',
      description: 'Perform database backup and upload to S3 storage',
      category: 'Backup',
      namespace: 'Database',
      tags: ['backup', 'database', 's3'],
      icon: 'Database',
      formSchema: JSON.stringify({
        fields: [
          { id: 'db_name', label: 'Database Name', type: 'text', required: true },
          { id: 'backup_type', label: 'Backup Type', type: 'select', options: ['Full', 'Incremental'], required: true },
          { id: 's3_bucket', label: 'S3 Bucket', type: 'text', placeholder: 'backups-prod', required: true }
        ]
      }),
      templateId: '103',
      awxJobTemplateId: '103',
      customBody: JSON.stringify({
        inventory: 'database-servers',
        extra_vars: { db_name: '{{form.db_name}}', backup_type: '{{form.backup_type}}', s3_bucket: '{{form.s3_bucket}}' }
      }),
      createdBy: 'admin',
      enabled: true,
    },
  }));

  automations.push(await prisma.automation.create({
    data: {
      name: 'Provision New User Account',
      description: 'Create user accounts across all systems',
      category: 'Security',
      namespace: 'IAM',
      tags: ['user', 'provisioning', 'access'],
      icon: 'UserPlus',
      formSchema: JSON.stringify({
        fields: [
          { id: 'username', label: 'Username', type: 'text', required: true },
          { id: 'email', label: 'Email', type: 'text', required: true },
          { id: 'department', label: 'Department', type: 'select', options: ['IT', 'HR', 'Finance', 'Operations'], required: true },
          { id: 'access_level', label: 'Access Level', type: 'select', options: ['Standard', 'Admin', 'ReadOnly'], required: true }
        ]
      }),
      templateId: '104',
      awxJobTemplateId: '104',
      customBody: JSON.stringify({
        inventory: 'iam-systems',
        extra_vars: { username: '{{form.username}}', email: '{{form.email}}', department: '{{form.department}}', access_level: '{{form.access_level}}' }
      }),
      createdBy: 'admin',
      enabled: true,
    },
  }));

  automations.push(await prisma.automation.create({
    data: {
      name: 'Apply Security Patches',
      description: 'Apply latest security patches to servers',
      category: 'Security',
      namespace: 'Patching',
      tags: ['security', 'patch', 'update'],
      icon: 'Shield',
      formSchema: JSON.stringify({
        fields: [
          { id: 'server_group', label: 'Server Group', type: 'select', options: ['Web Servers', 'App Servers', 'DB Servers', 'All'], required: true },
          { id: 'patch_level', label: 'Patch Level', type: 'select', options: ['Critical', 'High', 'All'], required: true },
          { id: 'reboot', label: 'Reboot After', type: 'select', options: ['Yes', 'No'], required: true }
        ]
      }),
      templateId: '105',
      awxJobTemplateId: '105',
      customBody: JSON.stringify({
        inventory: 'all-servers',
        extra_vars: { server_group: '{{form.server_group}}', patch_level: '{{form.patch_level}}', reboot: '{{form.reboot}}' }
      }),
      createdBy: 'admin',
      enabled: true,
    },
  }));

  */

  console.log(`Created ${automations.length} test catalog items`);

  // Create 5 test schedules
  console.log('Creating test schedules...');
  const schedules = [];

  /* Temporarily disabled - will be fixed in next update

  schedules.push(await prisma.schedule.create({
    data: {
      name: 'Daily Server Health Check',
      description: 'Run server health checks every morning',
      automationId: automations[0].id,
      cronExpression: '0 6 * * *',
      timezone: 'America/New_York',
      enabled: true,
      formData: JSON.stringify({ servers: 'prod-web-01,prod-web-02', check_type: 'Full' }),
      createdBy: 'admin',
    },
  }));

  schedules.push(await prisma.schedule.create({
    data: {
      name: 'Weekly Database Backup',
      description: 'Full database backup every Sunday',
      automationId: automations[2].id,
      cronExpression: '0 2 * * 0',
      timezone: 'UTC',
      enabled: true,
      formData: JSON.stringify({ db_name: 'production_db', backup_type: 'Full', s3_bucket: 'backups-prod' }),
      createdBy: 'admin',
    },
  }));

  schedules.push(await prisma.schedule.create({
    data: {
      name: 'Monthly Security Patches',
      description: 'Apply security patches first weekend of month',
      automationId: automations[4].id,
      cronExpression: '0 3 1-7 * 6',
      timezone: 'America/New_York',
      enabled: true,
      formData: JSON.stringify({ server_group: 'All', patch_level: 'Critical', reboot: 'Yes' }),
      createdBy: 'admin',
    },
  }));

  schedules.push(await prisma.schedule.create({
    data: {
      name: 'Hourly Production Monitoring',
      description: 'Quick health check every hour',
      automationId: automations[0].id,
      cronExpression: '0 * * * *',
      timezone: 'UTC',
      enabled: true,
      formData: JSON.stringify({ servers: 'prod-all', check_type: 'Quick' }),
      createdBy: 'admin',
    },
  }));

  schedules.push(await prisma.schedule.create({
    data: {
      name: 'Nightly Incremental Backup',
      description: 'Incremental database backup every night',
      automationId: automations[2].id,
      cronExpression: '0 1 * * *',
      timezone: 'UTC',
      enabled: true,
      formData: JSON.stringify({ db_name: 'production_db', backup_type: 'Incremental', s3_bucket: 'backups-prod' }),
      createdBy: 'admin',
    },
  }));

  */

  console.log(`Created ${schedules.length} test schedules`);

  // Create additional system logs
  console.log('Creating additional system logs...');
  const systemLogs = [];

  /* Temporarily disabled - automations array is empty

  // Login logs
  systemLogs.push(await prisma.activity.create({
    data: {
      action: 'login',
      entityType: 'system',
      entityId: 'system',
      entityName: 'User Login',
      description: 'User logged in successfully',
      performedBy: testUsers[0].email,
      metadata: JSON.stringify({ ip: '192.168.1.100', userAgent: 'Mozilla/5.0', timestamp: new Date().toISOString() }),
    },
  }));

  systemLogs.push(await prisma.activity.create({
    data: {
      action: 'login',
      entityType: 'system',
      entityId: 'system',
      entityName: 'User Login',
      description: 'User logged in successfully',
      performedBy: testUsers[1].email,
      metadata: JSON.stringify({ ip: '192.168.1.101', userAgent: 'Chrome/120.0', timestamp: new Date().toISOString() }),
    },
  }));

  // Automation execution logs
  systemLogs.push(await prisma.activity.create({
    data: {
      action: 'executed',
      entityType: 'automation',
      entityId: automations[0].id,
      entityName: automations[0].name,
      description: 'Automation executed successfully',
      performedBy: testUsers[0].email,
      metadata: JSON.stringify({
        status: 'success',
        duration: '45s',
        awxJobId: '12345',
        result: 'All servers healthy'
      }),
    },
  }));

  systemLogs.push(await prisma.activity.create({
    data: {
      action: 'executed',
      entityType: 'automation',
      entityId: automations[2].id,
      entityName: automations[2].name,
      description: 'Automation executed with warnings',
      performedBy: testUsers[1].email,
      metadata: JSON.stringify({
        status: 'success',
        duration: '2m 30s',
        awxJobId: '12346',
        warnings: ['Slow response from backup server'],
        backupSize: '15.2 GB'
      }),
    },
  }));

  systemLogs.push(await prisma.activity.create({
    data: {
      action: 'failed',
      entityType: 'automation',
      entityId: automations[1].id,
      entityName: automations[1].name,
      description: 'Automation execution failed',
      performedBy: testUsers[2].email,
      metadata: JSON.stringify({
        status: 'failed',
        duration: '1m 15s',
        awxJobId: '12347',
        error: 'Connection timeout to deployment server',
        retryCount: 3
      }),
    },
  }));

  // Schedule execution logs
  systemLogs.push(await prisma.activity.create({
    data: {
      action: 'scheduled_run',
      entityType: 'schedule',
      entityId: schedules[0].id,
      entityName: schedules[0].name,
      description: 'Scheduled automation executed successfully',
      performedBy: 'system',
      metadata: JSON.stringify({
        automationId: automations[0].id,
        cronExpression: '0 6 * * *',
        status: 'success',
        executionTime: '38s'
      }),
    },
  }));

  systemLogs.push(await prisma.activity.create({
    data: {
      action: 'scheduled_run',
      entityType: 'schedule',
      entityId: schedules[1].id,
      entityName: schedules[1].name,
      description: 'Scheduled backup completed',
      performedBy: 'system',
      metadata: JSON.stringify({
        automationId: automations[2].id,
        cronExpression: '0 2 * * 0',
        status: 'success',
        executionTime: '5m 22s',
        backupSize: '42.8 GB'
      }),
    },
  }));

  // Settings changes
  systemLogs.push(await prisma.activity.create({
    data: {
      action: 'updated',
      entityType: 'settings',
      entityId: 'awx-config',
      entityName: 'AWX Configuration',
      description: 'AWX base URL updated',
      performedBy: 'admin',
      metadata: JSON.stringify({
        field: 'awx_base_url',
        oldValue: 'https://old-awx.example.com',
        newValue: 'https://awx.example.com'
      }),
    },
  }));

  systemLogs.push(await prisma.activity.create({
    data: {
      action: 'updated',
      entityType: 'settings',
      entityId: 'email-config',
      entityName: 'Email Configuration',
      description: 'SMTP settings configured',
      performedBy: 'admin',
      metadata: JSON.stringify({
        smtpHost: 'smtp.gmail.com',
        smtpPort: '587',
        emailEnabled: true
      }),
    },
  }));

  // Catalog operations
  systemLogs.push(await prisma.activity.create({
    data: {
      action: 'created',
      entityType: 'automation',
      entityId: automations[3].id,
      entityName: automations[3].name,
      description: 'New automation added to catalog',
      performedBy: 'admin',
      metadata: JSON.stringify({
        category: automations[3].category,
        namespace: automations[3].namespace,
        tags: automations[3].tags
      }),
    },
  }));

  systemLogs.push(await prisma.activity.create({
    data: {
      action: 'updated',
      entityType: 'automation',
      entityId: automations[4].id,
      entityName: automations[4].name,
      description: 'Automation updated',
      performedBy: 'admin',
      metadata: JSON.stringify({
        changes: ['description', 'formSchema'],
        version: '1.1'
      }),
    },
  }));

  // Schedule operations
  systemLogs.push(await prisma.activity.create({
    data: {
      action: 'created',
      entityType: 'schedule',
      entityId: schedules[2].id,
      entityName: schedules[2].name,
      description: 'New schedule created',
      performedBy: 'admin',
      metadata: JSON.stringify({
        cronExpression: schedules[2].cronExpression,
        timezone: schedules[2].timezone,
        automationName: automations[4].name
      }),
    },
  }));

  systemLogs.push(await prisma.activity.create({
    data: {
      action: 'enabled',
      entityType: 'schedule',
      entityId: schedules[3].id,
      entityName: schedules[3].name,
      description: 'Schedule enabled',
      performedBy: 'admin',
      metadata: JSON.stringify({
        previousState: 'disabled',
        newState: 'enabled',
        nextRun: new Date(Date.now() + 3600000).toISOString()
      }),
    },
  }));

  // User management logs
  systemLogs.push(await prisma.activity.create({
    data: {
      action: 'password_reset',
      entityType: 'user',
      entityId: testUsers[3].id,
      entityName: testUsers[3].name,
      description: 'Password reset requested',
      performedBy: testUsers[3].email,
      metadata: JSON.stringify({
        resetMethod: 'email',
        resetToken: 'tok_' + Math.random().toString(36).substring(7)
      }),
    },
  }));

  systemLogs.push(await prisma.activity.create({
    data: {
      action: 'updated',
      entityType: 'user',
      entityId: testUsers[4].id,
      entityName: testUsers[4].name,
      description: 'User role changed',
      performedBy: 'admin',
      metadata: JSON.stringify({
        field: 'role',
        oldValue: 'user',
        newValue: 'admin'
      }),
    },
  }));

  // Group membership logs
  systemLogs.push(await prisma.activity.create({
    data: {
      action: 'member_added',
      entityType: 'group',
      entityId: groups[0].id,
      entityName: groups[0].name,
      description: 'User added to group',
      performedBy: 'admin',
      metadata: JSON.stringify({
        userId: testUsers[0].id,
        userName: testUsers[0].name,
        memberCount: 2
      }),
    },
  }));

  // System events
  systemLogs.push(await prisma.activity.create({
    data: {
      action: 'system_start',
      entityType: 'system',
      entityId: 'system',
      entityName: 'System Startup',
      description: 'Application started successfully',
      performedBy: 'system',
      metadata: JSON.stringify({
        version: '1.0.2',
        nodeVersion: process.version,
        platform: process.platform,
        uptime: '0s'
      }),
    },
  }));

  systemLogs.push(await prisma.activity.create({
    data: {
      action: 'database_backup',
      entityType: 'system',
      entityId: 'system',
      entityName: 'Database Backup',
      description: 'Automated database backup completed',
      performedBy: 'system',
      metadata: JSON.stringify({
        backupType: 'automated',
        backupSize: '125 MB',
        backupLocation: '/backups/autoclik_2025-11-18.db',
        duration: '2.3s'
      }),
    },
  }));

  systemLogs.push(await prisma.activity.create({
    data: {
      action: 'cleanup',
      entityType: 'system',
      entityId: 'system',
      entityName: 'Log Cleanup',
      description: 'Old log entries cleaned up',
      performedBy: 'system',
      metadata: JSON.stringify({
        entriesDeleted: 150,
        olderThan: '90 days',
        freedSpace: '5.2 MB'
      }),
    },
  }));

  // Logout logs
  systemLogs.push(await prisma.activity.create({
    data: {
      action: 'logout',
      entityType: 'system',
      entityId: 'system',
      entityName: 'User Logout',
      description: 'User logged out',
      performedBy: testUsers[0].email,
      metadata: JSON.stringify({
        sessionDuration: '2h 15m',
        ip: '192.168.1.100'
      }),
    },
  }));

  */

  console.log(`Created ${systemLogs.length} additional system logs`);

  console.log('\n=== Database seeded successfully! ===');
  console.log('\nTest Accounts Created:');
  console.log('  Admin: Shinish / P@ssw0rd');
  console.log('  Users: [firstname].[lastname]@company.com / password123');
  console.log('\nTest Data Summary:');
  console.log(`  - Groups: ${groups.length}`);
  console.log(`  - Users: ${testUsers.length}`);
  console.log(`  - Credentials: ${credentials.length}`);
  console.log(`  - Activity Logs: ${activities.length + systemLogs.length}`);
  console.log(`  - Catalog Items: ${automations.length}`);
  console.log(`  - Schedules: ${schedules.length}`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
