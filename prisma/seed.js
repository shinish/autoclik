const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash password for admin user
  const hashedPassword = await bcrypt.hash('admin', 10);

  // Create namespaces
  const infraNamespace = await prisma.namespace.create({
    data: {
      name: 'infra',
      displayName: 'Infrastructure',
      description: 'Automations related to infrastructure and compute resources',
      color: '#3b82f6',
      createdBy: 'admin@example.com',
    },
  });

  const dataNamespace = await prisma.namespace.create({
    data: {
      name: 'data',
      displayName: 'Data & Database',
      description: 'Automations for data backup, migration, and database operations',
      color: '#8b5cf6',
      createdBy: 'admin@example.com',
    },
  });

  const securityNamespace = await prisma.namespace.create({
    data: {
      name: 'security',
      displayName: 'Security',
      description: 'Security-related automations including key rotation and access management',
      color: '#ef4444',
      createdBy: 'admin@example.com',
    },
  });

  const devopsNamespace = await prisma.namespace.create({
    data: {
      name: 'devops',
      displayName: 'DevOps',
      description: 'CI/CD and deployment automation workflows',
      color: '#10b981',
      createdBy: 'admin@example.com',
    },
  });

  // Create users
  const adminUser = await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'User',
      name: 'Administrator',
      samAccountName: 'admin',
      email: 'admin',
      password: hashedPassword,
      role: 'admin',
      enabled: true,
      locked: false,
      location: 'Headquarters',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      firstName: 'Jane',
      lastName: 'Smith',
      name: 'Jane Smith',
      samAccountName: 'jsmith',
      email: 'jane@example.com',
      password: hashedPassword, // Same password for demo
      role: 'user',
      enabled: true,
      locked: false,
      location: 'New York Office',
    },
  });

  const user1 = await prisma.user.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
      samAccountName: 'jdoe',
      email: 'john@example.com',
      password: hashedPassword, // Same password for demo
      role: 'user',
      enabled: true,
      locked: false,
      location: 'Chicago Office',
      managerId: user2.id, // Jane is John's manager
    },
  });

  // Create predefined groups with module permissions
  const adminGroup = await prisma.group.create({
    data: {
      name: 'Administrators',
      description: 'Full access to all modules and administrative functions',
      isPredefined: true,
      modulePermissions: {
        create: [
          { module: 'dashboard', canRead: true, canWrite: true, canDelete: true },
          { module: 'automations', canRead: true, canWrite: true, canDelete: true },
          { module: 'schedules', canRead: true, canWrite: true, canDelete: true },
          { module: 'catalog', canRead: true, canWrite: true, canDelete: true },
          { module: 'settings', canRead: true, canWrite: true, canDelete: true },
        ],
      },
    },
  });

  const operatorsGroup = await prisma.group.create({
    data: {
      name: 'Operators',
      description: 'Can create and manage automations and schedules',
      isPredefined: true,
      modulePermissions: {
        create: [
          { module: 'dashboard', canRead: true, canWrite: false, canDelete: false },
          { module: 'automations', canRead: true, canWrite: true, canDelete: false },
          { module: 'schedules', canRead: true, canWrite: true, canDelete: false },
          { module: 'catalog', canRead: true, canWrite: false, canDelete: false },
          { module: 'settings', canRead: false, canWrite: false, canDelete: false },
        ],
      },
    },
  });

  const viewersGroup = await prisma.group.create({
    data: {
      name: 'Viewers',
      description: 'Read-only access to view automations and schedules',
      isPredefined: true,
      modulePermissions: {
        create: [
          { module: 'dashboard', canRead: true, canWrite: false, canDelete: false },
          { module: 'automations', canRead: true, canWrite: false, canDelete: false },
          { module: 'schedules', canRead: true, canWrite: false, canDelete: false },
          { module: 'catalog', canRead: true, canWrite: false, canDelete: false },
          { module: 'settings', canRead: false, canWrite: false, canDelete: false },
        ],
      },
    },
  });

  // Create custom groups
  const devopsGroup = await prisma.group.create({
    data: {
      name: 'DevOps Team',
      description: 'Team responsible for infrastructure and deployment automation',
    },
  });

  const securityGroup = await prisma.group.create({
    data: {
      name: 'Security Team',
      description: 'Security operations and compliance team',
    },
  });

  // Add users to groups
  await prisma.groupMember.create({
    data: {
      userId: user1.id,
      groupId: devopsGroup.id,
    },
  });

  await prisma.groupMember.create({
    data: {
      userId: user2.id,
      groupId: securityGroup.id,
    },
  });

  // Create namespace permissions
  // Admin has full access to all namespaces
  await prisma.namespacePermission.create({
    data: {
      namespaceId: infraNamespace.id,
      userId: adminUser.id,
      canRead: true,
      canWrite: true,
      canExecute: true,
      canAdmin: true,
    },
  });

  // DevOps team has access to infra and devops namespaces
  await prisma.namespacePermission.create({
    data: {
      namespaceId: infraNamespace.id,
      groupId: devopsGroup.id,
      canRead: true,
      canWrite: true,
      canExecute: true,
      canAdmin: false,
    },
  });

  await prisma.namespacePermission.create({
    data: {
      namespaceId: devopsNamespace.id,
      groupId: devopsGroup.id,
      canRead: true,
      canWrite: true,
      canExecute: true,
      canAdmin: false,
    },
  });

  // Security team has access to security namespace
  await prisma.namespacePermission.create({
    data: {
      namespaceId: securityNamespace.id,
      groupId: securityGroup.id,
      canRead: true,
      canWrite: true,
      canExecute: true,
      canAdmin: false,
    },
  });

  // Create sample automations
  const automation1 = await prisma.automation.create({
    data: {
      name: 'Provision VM',
      namespace: 'infra',
      description: 'Creates and configures a new virtual machine in the cloud.',
      keywords: JSON.stringify(['vm', 'aws', 'ec2', 'compute']),
      tags: JSON.stringify(['aws', 'vm']),
      formSchema: JSON.stringify([
        { type: 'text', label: 'Instance Name', key: 'hostname', required: true },
        { type: 'select', label: 'Provider', key: 'provider', options: ['AWS', 'GCP'], required: true },
        { type: 'number', label: 'CPU Cores', key: 'cpu', required: true },
        { type: 'number', label: 'Memory (MB)', key: 'memory', required: true },
      ]),
      apiEndpoint: 'https://api.internal.example.com',
      templateId: 'tmpl-provision-vm',
      inventoryId: 'inv-global-01',
      customBody: JSON.stringify({
        inventory: 'inv-global-01',
        extra_vars: {
          vm_name: '{{form.hostname}}',
          provider: '{{form.provider}}',
          cpu_cores: '{{form.cpu}}',
          memory_mb: '{{form.memory}}'
        }
      }),
      extraVars: 'vm_name: "{{form.hostname}}"\ncpu_cores: "{{form.cpu}}"\nmemory_mb: "{{form.memory}}"',
      pinned: true,
      runs: 1243,
      createdBy: 'admin@example.com',
    },
  });

  const automation2 = await prisma.automation.create({
    data: {
      name: 'Daily Backup',
      namespace: 'data',
      description: 'Performs a daily backup of critical production databases.',
      keywords: JSON.stringify(['backup', 'database', 'postgres']),
      tags: JSON.stringify(['backup', 'postgres']),
      formSchema: JSON.stringify([
        { type: 'text', label: 'Database Name', key: 'db_name', required: true },
        { type: 'text', label: 'Backup Path', key: 'backup_path', required: true },
      ]),
      apiEndpoint: 'https://api.internal.example.com',
      templateId: 'tmpl-backup-db',
      inventoryId: 'inv-db-servers',
      customBody: JSON.stringify({
        inventory: 'inv-db-servers',
        instance_groups: [123],
        extra_vars: {
          db_name: '{{form.db_name}}',
          backup_path: '{{form.backup_path}}',
          source: 'system'
        }
      }),
      extraVars: 'db_name: "{{form.db_name}}"\nbackup_path: "{{form.backup_path}}"',
      pinned: true,
      runs: 891,
      createdBy: 'admin@example.com',
    },
  });

  const automation3 = await prisma.automation.create({
    data: {
      name: 'Rotate Access Keys',
      namespace: 'security',
      description: 'Automatically rotate IAM access keys for a given user to enhance security.',
      keywords: JSON.stringify(['aws', 'iam', 'security', 'keys']),
      tags: JSON.stringify(['aws', 'iam']),
      formSchema: JSON.stringify([
        { type: 'text', label: 'IAM User', key: 'iam_user', required: true },
      ]),
      apiEndpoint: 'https://api.internal.example.com',
      templateId: 'tmpl-rotate-keys',
      inventoryId: 'inv-aws-accounts',
      customBody: JSON.stringify({
        inventory: 'inv-aws-accounts',
        extra_vars: {
          iam_user: '{{form.iam_user}}',
          rotate_keys: true
        }
      }),
      extraVars: 'iam_user: "{{form.iam_user}}"',
      pinned: false,
      runs: 2500,
      createdBy: 'security@example.com',
    },
  });

  // Create sample runs with more variety
  const runs = [];
  const automations = [automation1, automation2, automation3];
  const statuses = ['success', 'success', 'success', 'success', 'failed', 'running', 'pending'];

  // Create 30 runs over the past 30 days
  for (let i = 0; i < 30; i++) {
    const automation = automations[i % automations.length];
    const daysAgo = Math.floor(i / 3);
    const hoursOffset = Math.floor(Math.random() * 24);
    const minutesOffset = Math.floor(Math.random() * 60);
    const startedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - hoursOffset * 60 * 60 * 1000 - minutesOffset * 60 * 1000);
    const executionMinutes = Math.floor(Math.random() * 15) + 1;
    const completedAt = new Date(startedAt.getTime() + executionMinutes * 60 * 1000);
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    let parameters, result, errorMessage;

    if (automation.id === automation1.id) {
      parameters = JSON.stringify({ hostname: `server-${i}`, provider: 'AWS', cpu: 4, memory: 8192 });
      result = status === 'success' ? JSON.stringify({ status: 'completed', instance_id: `i-${Math.random().toString(36).substr(2, 9)}` }) : null;
      errorMessage = status === 'failed' ? 'Insufficient capacity in availability zone' : null;
    } else if (automation.id === automation2.id) {
      parameters = JSON.stringify({ db_name: 'production_db', backup_path: '/backups/prod' });
      result = status === 'success' ? JSON.stringify({ status: 'completed', backup_file: `/backups/prod/backup_${new Date().toISOString().split('T')[0]}.sql` }) : null;
      errorMessage = status === 'failed' ? 'Database connection timeout' : null;
    } else {
      parameters = JSON.stringify({ iam_user: `service-account-${i}` });
      result = status === 'success' ? JSON.stringify({ status: 'completed', new_key_id: 'AKIA...' }) : null;
      errorMessage = status === 'failed' ? 'Insufficient IAM permissions' : null;
    }

    runs.push(
      prisma.run.create({
        data: {
          automationId: automation.id,
          status,
          parameters,
          result,
          errorMessage,
          startedAt,
          completedAt: status === 'running' || status === 'pending' ? null : completedAt,
          awxJobId: `${12345 + i}`,
        },
      })
    );
  }

  await Promise.all(runs);

  // Create sample schedules
  await prisma.schedule.create({
    data: {
      name: 'Daily Server Health Check',
      automationId: automation1.id,
      frequency: 'Every day at 3:00 AM',
      cron: '0 3 * * *',
      parameters: JSON.stringify({ check_type: 'health' }),
      status: 'active',
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    },
  });

  await prisma.schedule.create({
    data: {
      name: 'Weekly Database Backup',
      automationId: automation2.id,
      frequency: 'Every Monday at 9:00 AM',
      cron: '0 9 * * 1',
      parameters: JSON.stringify({ db_name: 'production_db' }),
      status: 'active',
      nextRun: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    },
  });

  // Create settings
  await prisma.setting.create({
    data: {
      key: 'default_api_endpoint',
      value: 'https://awx.example.com/api/v2',
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

  // Create sample notifications
  await prisma.notification.create({
    data: {
      type: 'error',
      title: "Schedule 'Daily Backup' failed.",
      message: 'The scheduled automation failed to execute. Please check the logs.',
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      type: 'info',
      title: "New automation 'Slack Notifier' added to the Catalog.",
      message: 'A new automation is now available in the catalog.',
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      type: 'warning',
      title: 'Cloud API key is expiring in 3 days.',
      message: 'Please rotate your API keys before they expire.',
      read: false,
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
