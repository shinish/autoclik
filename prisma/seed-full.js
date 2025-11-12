const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🗑️  Clearing existing data...');
  await prisma.activity.deleteMany({});
  await prisma.run.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.automation.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.credential.deleteMany({});
  await prisma.namespacePermission.deleteMany({});
  await prisma.namespace.deleteMany({});
  await prisma.groupMember.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✅ Cleared existing data\n');

  // ============================================================================
  // 1. Create Users (25 users)
  // ============================================================================
  console.log('👥 Creating users...');
  const users = [];
  const departments = ['Engineering', 'Operations', 'Security', 'DevOps', 'IT Support'];
  const locations = ['New York', 'San Francisco', 'Chicago', 'Austin', 'Seattle'];

  // Create admin user
  users.push(await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'User',
      name: 'Admin User',
      samAccountName: 'admin',
      email: 'admin@example.com',
      password: 'password',
      role: 'admin',
      enabled: true,
      locked: false,
      location: 'New York',
      department: 'IT Support',
    },
  }));

  // Create regular users
  for (let i = 1; i <= 24; i++) {
    users.push(await prisma.user.create({
      data: {
        firstName: `User${i}`,
        lastName: `Doe`,
        name: `User${i} Doe`,
        samAccountName: `user${i}`,
        email: `user${i}@example.com`,
        password: 'password',
        role: i % 5 === 0 ? 'admin' : 'user',
        enabled: i % 10 !== 0, // 10% disabled
        locked: i % 15 === 0, // Some locked
        location: locations[i % locations.length],
        department: departments[i % departments.length],
      },
    }));
  }
  console.log(`✅ Created ${users.length} users\n`);

  // ============================================================================
  // 2. Create Groups (10 groups)
  // ============================================================================
  console.log('👨‍👩‍👧‍👦 Creating groups...');
  const groups = [];
  const groupNames = [
    'DevOps Team',
    'Security Team',
    'Operations Team',
    'Engineering Team',
    'IT Support Team',
    'Network Team',
    'Database Team',
    'Cloud Team',
    'Infrastructure Team',
    'Platform Team'
  ];

  for (let i = 0; i < groupNames.length; i++) {
    const group = await prisma.group.create({
      data: {
        name: groupNames[i],
        description: `${groupNames[i]} - Responsible for ${groupNames[i].toLowerCase()} operations`,
      },
    });
    groups.push(group);

    // Add 3-5 members to each group
    const numMembers = 3 + (i % 3);
    for (let j = 0; j < numMembers; j++) {
      const userIndex = (i * 2 + j) % users.length;
      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId: users[userIndex].id,
        },
      });
    }
  }
  console.log(`✅ Created ${groups.length} groups\n`);

  // ============================================================================
  // 3. Create Namespaces (20 namespaces)
  // ============================================================================
  console.log('📁 Creating namespaces...');
  const namespaces = [];
  const namespaceConfigs = [
    { name: 'Production', displayName: 'Production Environment', color: '#dc2626', icon: '🚀' },
    { name: 'Staging', displayName: 'Staging Environment', color: '#f59e0b', icon: '🎭' },
    { name: 'Development', displayName: 'Development Environment', color: '#10b981', icon: '💻' },
    { name: 'Testing', displayName: 'Testing Environment', color: '#3b82f6', icon: '🧪' },
    { name: 'Infrastructure', displayName: 'Infrastructure', color: '#8b5cf6', icon: '🏗️' },
    { name: 'Security', displayName: 'Security Operations', color: '#ef4444', icon: '🔒' },
    { name: 'Networking', displayName: 'Network Operations', color: '#06b6d4', icon: '🌐' },
    { name: 'Database', displayName: 'Database Management', color: '#84cc16', icon: '🗄️' },
    { name: 'Monitoring', displayName: 'Monitoring & Alerts', color: '#f97316', icon: '📊' },
    { name: 'Backup', displayName: 'Backup & Recovery', color: '#6366f1', icon: '💾' },
    { name: 'Compliance', displayName: 'Compliance & Audit', color: '#a855f7', icon: '📋' },
    { name: 'Analytics', displayName: 'Data Analytics', color: '#ec4899', icon: '📈' },
    { name: 'CloudOps', displayName: 'Cloud Operations', color: '#14b8a6', icon: '☁️' },
    { name: 'DevSecOps', displayName: 'DevSecOps', color: '#f43f5e', icon: '🛡️' },
    { name: 'Automation', displayName: 'Automation Hub', color: '#4c12a1', icon: '⚙️' },
    { name: 'Deployment', displayName: 'Deployment Services', color: '#2563eb', icon: '🚢' },
    { name: 'Maintenance', displayName: 'Maintenance Tasks', color: '#ca8a04', icon: '🔧' },
    { name: 'Integration', displayName: 'System Integration', color: '#0891b2', icon: '🔗' },
    { name: 'Performance', displayName: 'Performance Tuning', color: '#7c3aed', icon: '⚡' },
    { name: 'Disaster Recovery', displayName: 'Disaster Recovery', color: '#dc2626', icon: '🆘' },
  ];

  for (const config of namespaceConfigs) {
    const namespace = await prisma.namespace.create({
      data: {
        name: config.name,
        displayName: config.displayName,
        description: `${config.displayName} - Automated operations and tasks`,
        color: config.color,
        icon: config.icon,
        createdBy: users[0].email,
      },
    });
    namespaces.push(namespace);

    // Add some permissions for each namespace
    const numPermissions = 2 + (namespaces.length % 3);
    for (let i = 0; i < numPermissions; i++) {
      await prisma.namespacePermission.create({
        data: {
          namespaceId: namespace.id,
          userId: users[i % users.length].id,
          canRead: true,
          canWrite: i % 2 === 0,
          canExecute: i % 3 === 0,
          canAdmin: i % 4 === 0,
        },
      });
    }
  }
  console.log(`✅ Created ${namespaces.length} namespaces\n`);

  // ============================================================================
  // 4. Create Credentials (15 credentials)
  // ============================================================================
  console.log('🔑 Creating credentials...');
  const credentials = [];
  const credentialTypes = ['machine', 'vault', 'network', 'cloud', 'database'];
  for (let i = 1; i <= 15; i++) {
    credentials.push(await prisma.credential.create({
      data: {
        name: `Credential ${i}`,
        credentialType: credentialTypes[i % credentialTypes.length],
        description: `Secure credential for automation ${i}`,
        username: `cred_user_${i}`,
        password: `encrypted_password_${i}`,
        createdBy: users[i % users.length].email,
      },
    }));
  }
  console.log(`✅ Created ${credentials.length} credentials\n`);

  // ============================================================================
  // 5. Create Automations (30 automations)
  // ============================================================================
  console.log('🤖 Creating automations...');
  const automations = [];
  const automationTemplates = [
    'Server Restart', 'Database Backup', 'Log Rotation', 'Security Scan',
    'Performance Check', 'Deployment', 'Config Update', 'Certificate Renewal',
    'Cleanup Task', 'Health Check', 'Monitoring Setup', 'Alert Configuration',
    'User Provisioning', 'Access Review', 'Compliance Check', 'Patch Management',
    'Network Configuration', 'Load Balancer Update', 'DNS Update', 'Firewall Rule',
    'Storage Optimization', 'Cache Clear', 'Service Restart', 'Data Migration',
    'Report Generation', 'Log Analysis', 'Incident Response', 'Backup Verification',
    'Disaster Recovery Test', 'Security Audit'
  ];

  for (let i = 0; i < automationTemplates.length; i++) {
    const namespace = namespaces[i % namespaces.length];
    automations.push(await prisma.automation.create({
      data: {
        name: `${automationTemplates[i]} - ${namespace.displayName}`,
        description: `Automated ${automationTemplates[i].toLowerCase()} for ${namespace.displayName.toLowerCase()}`,
        namespace: namespace.name,
        templateId: `template_${i + 1}`,
        inventoryId: `inventory_${i + 1}`,
        formSchema: JSON.stringify({
          fields: [
            { name: 'target', type: 'text', label: 'Target Server', required: true, placeholder: 'e.g., server-01' },
            { name: 'timeout', type: 'number', label: 'Timeout (seconds)', required: false, default: 300 },
            { name: 'confirm', type: 'checkbox', label: 'Confirm Execution', required: true }
          ]
        }),
        extraVars: `---\ntarget: "{{form.target}}"\ntimeout: "{{form.timeout}}"\naction: "${automationTemplates[i].toLowerCase().replace(' ', '_')}"`,
        keywords: JSON.stringify(['automation', 'task', namespace.name.toLowerCase()]),
        tags: JSON.stringify([automationTemplates[i].split(' ')[0], namespace.name]),
        createdBy: users[i % users.length].email,
        runs: Math.floor(Math.random() * 100),
        pinned: i % 5 === 0, // Pin every 5th automation
        featured: i % 7 === 0, // Feature some automations
      },
    }));
  }
  console.log(`✅ Created ${automations.length} automations\n`);

  // ============================================================================
  // 6. Create Schedules (25 schedules)
  // ============================================================================
  console.log('📅 Creating schedules...');
  const schedules = [];
  const frequencies = ['daily', 'weekly', 'monthly', 'hourly'];
  const cronExpressions = {
    daily: '0 0 * * *',
    weekly: '0 0 * * 0',
    monthly: '0 0 1 * *',
    hourly: '0 * * * *',
  };

  for (let i = 0; i < 25; i++) {
    const automation = automations[i % automations.length];
    const frequency = frequencies[i % frequencies.length];
    const nextRun = new Date(Date.now() + (i * 86400000)); // Stagger over 25 days

    schedules.push(await prisma.schedule.create({
      data: {
        automationId: automation.id,
        name: `Schedule for ${automation.name}`,
        frequency: frequency,
        cron: cronExpressions[frequency],
        status: i % 10 === 0 ? 'paused' : 'active', // 10% paused
        parameters: JSON.stringify({ scheduled: true }),
        nextRun: nextRun,
      },
    }));
  }
  console.log(`✅ Created ${schedules.length} schedules\n`);

  // ============================================================================
  // 7. Create Runs (100 runs with varied statuses and dates)
  // ============================================================================
  console.log('▶️  Creating runs...');
  const runs = [];
  const statuses = ['success', 'failed', 'running', 'pending'];
  const statusWeights = [70, 20, 5, 5]; // 70% success, 20% failed, 5% running, 5% pending

  for (let i = 0; i < 100; i++) {
    const automation = automations[i % automations.length];
    const executor = users[i % users.length];

    // Generate dates over the past 30 days
    const daysAgo = Math.floor(i / 3.5); // Spread runs across 30 days
    const startedAt = new Date(Date.now() - (daysAgo * 86400000) - (Math.random() * 86400000));

    // Weighted random status selection
    const random = Math.random() * 100;
    let cumulativeWeight = 0;
    let status = 'success';
    for (let j = 0; j < statuses.length; j++) {
      cumulativeWeight += statusWeights[j];
      if (random < cumulativeWeight) {
        status = statuses[j];
        break;
      }
    }

    // Calculate completion time based on status
    let completedAt = null;
    if (status === 'success' || status === 'failed') {
      const durationMinutes = 1 + Math.floor(Math.random() * 60); // 1-60 minutes
      completedAt = new Date(startedAt.getTime() + (durationMinutes * 60000));
    }

    const run = await prisma.run.create({
      data: {
        automationId: automation.id,
        uniqueId: `TASK${String.fromCharCode(65 + (i % 26))}${String(1000000 + i).slice(1)}`,
        status: status,
        startedAt: startedAt,
        completedAt: completedAt,
        executedBy: executor.email,
        parameters: JSON.stringify({
          target: `server-${i % 10 + 1}`,
          action: automation.name.split(' ')[0].toLowerCase(),
        }),
        awxJobId: status !== 'pending' ? `${10000 + i}` : null,
        result: status === 'success' ? JSON.stringify({ status: 'completed', exitCode: 0 }) : null,
        errorMessage: status === 'failed' ? `Error executing automation: Connection timeout` : null,
      },
    });
    runs.push(run);
  }
  console.log(`✅ Created ${runs.length} runs\n`);

  // ============================================================================
  // 8. Create Activities (150 activities)
  // ============================================================================
  console.log('📝 Creating activities...');
  const activities = [];
  const entityTypes = ['automation', 'schedule', 'user', 'namespace', 'credential'];
  const actions = ['created', 'updated', 'deleted', 'executed'];

  for (let i = 0; i < 150; i++) {
    const entityType = entityTypes[i % entityTypes.length];
    const action = actions[i % actions.length];
    const performer = users[i % users.length];

    // Generate dates over the past 30 days
    const daysAgo = Math.floor(i / 5);
    const createdAt = new Date(Date.now() - (daysAgo * 86400000) - (Math.random() * 86400000));

    let entityName, entityId;
    switch (entityType) {
      case 'automation':
        const auto = automations[i % automations.length];
        entityName = auto.name;
        entityId = auto.id;
        break;
      case 'schedule':
        const sched = schedules[i % schedules.length];
        entityName = sched.name;
        entityId = sched.id;
        break;
      case 'user':
        const user = users[(i + 1) % users.length];
        entityName = user.name;
        entityId = user.id;
        break;
      case 'namespace':
        const ns = namespaces[i % namespaces.length];
        entityName = ns.displayName;
        entityId = ns.id;
        break;
      case 'credential':
        const cred = credentials[i % credentials.length];
        entityName = cred.name;
        entityId = cred.id;
        break;
    }

    activities.push(await prisma.activity.create({
      data: {
        action: action,
        entityType: entityType,
        entityId: entityId,
        entityName: entityName,
        description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${entityType} "${entityName}"`,
        performedBy: performer.email,
        createdAt: createdAt,
        metadata: JSON.stringify({
          timestamp: createdAt,
          source: 'automation-platform',
        }),
      },
    }));
  }
  console.log(`✅ Created ${activities.length} activities\n`);

  // ============================================================================
  // 9. Create Notifications (30 notifications)
  // ============================================================================
  console.log('🔔 Creating notifications...');
  const notifications = [];
  const notificationTypes = ['info', 'warning', 'error', 'success'];
  const notificationTemplates = [
    { type: 'success', title: 'Automation completed successfully' },
    { type: 'error', title: 'Automation execution failed' },
    { type: 'warning', title: 'Schedule execution delayed' },
    { type: 'info', title: 'New automation added to catalog' },
    { type: 'warning', title: 'High failure rate detected' },
    { type: 'error', title: 'Critical automation failed' },
    { type: 'success', title: 'System health check passed' },
    { type: 'info', title: 'Scheduled maintenance upcoming' },
  ];

  for (let i = 0; i < 30; i++) {
    const template = notificationTemplates[i % notificationTemplates.length];
    const user = users[i % users.length];
    const createdAt = new Date(Date.now() - (i * 3600000)); // Spread over 30 hours

    notifications.push(await prisma.notification.create({
      data: {
        type: template.type,
        title: template.title,
        message: `Notification ${i + 1}: ${template.title}`,
        read: i % 3 === 0, // 33% read
        createdAt: createdAt,
      },
    }));
  }
  console.log(`✅ Created ${notifications.length} notifications\n`);

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('\n🎉 Database seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`  - Users: ${users.length}`);
  console.log(`  - Groups: ${groups.length}`);
  console.log(`  - Namespaces: ${namespaces.length}`);
  console.log(`  - Credentials: ${credentials.length}`);
  console.log(`  - Automations: ${automations.length}`);
  console.log(`  - Schedules: ${schedules.length}`);
  console.log(`  - Runs: ${runs.length}`);
  console.log(`  - Activities: ${activities.length}`);
  console.log(`  - Notifications: ${notifications.length}`);
  console.log('\n✅ All data seeded successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
