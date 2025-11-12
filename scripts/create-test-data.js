const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Creating test data...\n');

  // Create test namespace if not exists
  const namespace = await prisma.namespace.upsert({
    where: { name: 'Network' },
    update: {},
    create: {
      name: 'Network',
      displayName: 'Network Operations',
      description: 'Network connectivity and testing automations',
      color: '#3b82f6',
      icon: 'Network',
      createdBy: 'Shinish Sasidharan',
    },
  });
  console.log('✓ Created namespace:', namespace.name);

  // Create test automation: Test Connectivity
  const formSchema = JSON.stringify([
    {
      key: 'target_host',
      label: 'Target Host',
      type: 'text',
      placeholder: 'Enter hostname or IP address',
      required: true,
      helpText: 'The server or device to test connectivity to'
    },
    {
      key: 'port',
      label: 'Port Number',
      type: 'number',
      defaultValue: '22',
      required: true,
      helpText: 'Port to test (e.g., 22 for SSH, 443 for HTTPS)'
    },
    {
      key: 'protocol',
      label: 'Protocol',
      type: 'select',
      options: ['TCP', 'UDP', 'ICMP'],
      defaultValue: 'TCP',
      required: true
    },
    {
      key: 'timeout',
      label: 'Timeout (seconds)',
      type: 'number',
      defaultValue: '5',
      required: true
    },
    {
      key: 'retry_count',
      label: 'Retry Count',
      type: 'number',
      defaultValue: '3',
      required: false,
      helpText: 'Number of retry attempts on failure'
    }
  ]);

  const automation = await prisma.automation.upsert({
    where: { name: 'Test Connectivity' },
    update: {},
    create: {
      name: 'Test Connectivity',
      namespace: namespace.name,
      description: 'Test network connectivity to servers and ports. Validates if specified hosts are reachable and ports are accessible.',
      keywords: JSON.stringify(['network', 'connectivity', 'ping', 'test', 'port', 'tcp']),
      tags: JSON.stringify(['network', 'testing', 'diagnostics']),
      formSchema: formSchema,
      templateId: '100',
      inventoryId: '10',
      extraVars: 'target_host: "{{form.target_host}}"\nport: "{{form.port}}"\nprotocol: "{{form.protocol}}"\ntimeout: {{form.timeout}}\nretry_count: {{form.retry_count}}',
      pinned: true,
      featured: true,
      createdBy: 'Shinish Sasidharan',
      runs: 0,
    },
  });
  console.log('✓ Created automation:', automation.name);

  // Create test runs with mock data
  console.log('\n📊 Creating test execution history...');

  const testRuns = [
    {
      status: 'success',
      parameters: JSON.stringify({
        target_host: '192.168.1.100',
        port: 22,
        protocol: 'TCP',
        timeout: 5,
        retry_count: 3
      }),
      executedBy: 'Shinish Sasidharan',
      result: JSON.stringify({ message: 'Connection successful', response_time: '15ms' }),
      awxJobId: '12345',
      startedAt: new Date(Date.now() - 3600000), // 1 hour ago
      completedAt: new Date(Date.now() - 3599985000) // 15 seconds later
    },
    {
      status: 'success',
      parameters: JSON.stringify({
        target_host: 'web-server-01',
        port: 443,
        protocol: 'TCP',
        timeout: 5,
        retry_count: 3
      }),
      executedBy: 'Shinish Sasidharan',
      result: JSON.stringify({ message: 'Connection successful', response_time: '23ms' }),
      awxJobId: '12346',
      startedAt: new Date(Date.now() - 7200000), // 2 hours ago
      completedAt: new Date(Date.now() - 7199970000) // 30 seconds later
    },
    {
      status: 'failed',
      parameters: JSON.stringify({
        target_host: '192.168.1.200',
        port: 8080,
        protocol: 'TCP',
        timeout: 5,
        retry_count: 3
      }),
      executedBy: 'John Doe',
      errorMessage: 'Connection timeout after 3 retry attempts',
      awxJobId: '12347',
      startedAt: new Date(Date.now() - 10800000), // 3 hours ago
      completedAt: new Date(Date.now() - 10799840000) // 160 seconds later (with retries)
    },
    {
      status: 'success',
      parameters: JSON.stringify({
        target_host: 'database-01',
        port: 3306,
        protocol: 'TCP',
        timeout: 5,
        retry_count: 2
      }),
      executedBy: 'Shinish Sasidharan',
      result: JSON.stringify({ message: 'Connection successful', response_time: '8ms' }),
      awxJobId: '12348',
      startedAt: new Date(Date.now() - 86400000), // 1 day ago
      completedAt: new Date(Date.now() - 86399992000) // 8 seconds later
    },
    {
      status: 'success',
      parameters: JSON.stringify({
        target_host: 'api-gateway',
        port: 80,
        protocol: 'TCP',
        timeout: 3,
        retry_count: 1
      }),
      executedBy: 'Jane Smith',
      result: JSON.stringify({ message: 'Connection successful', response_time: '12ms' }),
      awxJobId: '12349',
      startedAt: new Date(Date.now() - 172800000), // 2 days ago
      completedAt: new Date(Date.now() - 172799988000) // 12 seconds later
    }
  ];

  // Generate unique IDs for runs
  const POOLS = ['A', 'B', 'C', 'D', 'E'];
  const currentYear = new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2);

  for (let i = 0; i < testRuns.length; i++) {
    const runData = testRuns[i];

    // Generate unique ID using pool-based system
    const pool = POOLS[i % POOLS.length];

    // Get or create counter for this year/pool
    const counter = await prisma.runCounter.upsert({
      where: {
        year_pool: {
          year: currentYear,
          pool: pool,
        },
      },
      update: {
        sequence: { increment: 1 },
        lastUsed: new Date(),
      },
      create: {
        year: currentYear,
        pool: pool,
        sequence: 1,
        lastUsed: new Date(),
      },
    });

    const sequenceStr = counter.sequence.toString().padStart(10, '0');
    const uniqueId = `TASK${yearSuffix}${pool}${sequenceStr}i`;

    await prisma.run.create({
      data: {
        automationId: automation.id,
        uniqueId: uniqueId,
        ...runData,
      },
    });
    console.log(`  ✓ Created run: ${uniqueId} - ${runData.status.toUpperCase()}`);
  }

  // Update automation runs count
  await prisma.automation.update({
    where: { id: automation.id },
    data: { runs: testRuns.length },
  });

  // Create activity logs
  console.log('\n📝 Creating activity logs...');

  for (let i = 0; i < testRuns.length; i++) {
    const run = testRuns[i];
    await prisma.activity.create({
      data: {
        action: 'executed',
        entityType: 'automation',
        entityId: automation.id,
        entityName: automation.name,
        description: `Executed automation "${automation.name}" - ${run.status}`,
        performedBy: run.executedBy,
        metadata: JSON.stringify({
          status: run.status,
          parameters: JSON.parse(run.parameters),
          awxJobId: run.awxJobId,
        }),
        createdAt: run.startedAt,
      },
    });
  }
  console.log('  ✓ Created', testRuns.length, 'activity log entries');

  console.log('\n✨ Test data created successfully!\n');
  console.log('Test Automation:', automation.name);
  console.log('Execution History:', testRuns.length, 'runs');
  console.log('Unique Run IDs:', 'Generated with TASK{YY}{POOL}{SEQ}i format');
  console.log('\n🎯 Ready to test at: http://localhost:3000/catalog/' + automation.id);
}

main()
  .catch((e) => {
    console.error('❌ Error creating test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
