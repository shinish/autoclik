const axios = require('axios');
const BASE_URL = process.env.TEST_URL || 'http://localhost:3003';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

const stats = { total: 0, passed: 0, failed: 0 };

async function test(name, fn) {
  stats.total++;
  try {
    await fn();
    stats.passed++;
    console.log(`${colors.green}✓${colors.reset} ${name}`);
  } catch (e) {
    stats.failed++;
    console.log(`${colors.red}✗${colors.reset} ${name}: ${e.message}`);
  }
}

async function runTests() {
  console.log(`\n${colors.cyan}${colors.bright}=== API Endpoint Tests ===${colors.reset}`);
  console.log(`Testing: ${BASE_URL}\n`);

  // Dashboard Tests
  await test('GET /api/dashboard', async () => {
    const r = await axios.get(`${BASE_URL}/api/dashboard`);
    if (!r.data.stats) throw new Error('Missing stats');
  });

  await test('GET /api/dashboard/stats', async () => {
    const r = await axios.get(`${BASE_URL}/api/dashboard/stats`);
    if (!r.data.stats) throw new Error('Missing stats');
  });

  // Automation Tests
  await test('GET /api/automations', async () => {
    const r = await axios.get(`${BASE_URL}/api/automations`);
    if (!Array.isArray(r.data)) throw new Error('Not an array');
  });

  // Runs Tests
  await test('GET /api/runs', async () => {
    const r = await axios.get(`${BASE_URL}/api/runs`);
    if (!Array.isArray(r.data)) throw new Error('Not an array');
  });

  // Schedules Tests
  await test('GET /api/schedules', async () => {
    const r = await axios.get(`${BASE_URL}/api/schedules`);
    if (!Array.isArray(r.data)) throw new Error('Not an array');
  });

  // Users Tests
  await test('GET /api/users', async () => {
    const r = await axios.get(`${BASE_URL}/api/users`);
    if (!Array.isArray(r.data)) throw new Error('Not an array');
  });

  // Namespaces Tests
  await test('GET /api/namespaces', async () => {
    const r = await axios.get(`${BASE_URL}/api/namespaces`);
    if (!Array.isArray(r.data)) throw new Error('Not an array');
  });

  // Groups Tests
  await test('GET /api/groups', async () => {
    const r = await axios.get(`${BASE_URL}/api/groups`);
    if (!Array.isArray(r.data)) throw new Error('Not an array');
  });

  // Credentials Tests
  await test('GET /api/credentials', async () => {
    const r = await axios.get(`${BASE_URL}/api/credentials`);
    if (!Array.isArray(r.data)) throw new Error('Not an array');
  });

  // Settings Tests
  await test('GET /api/settings', async () => {
    const r = await axios.get(`${BASE_URL}/api/settings`);
    if (!Array.isArray(r.data)) throw new Error('Not an array');
  });

  // Activity Tests
  await test('GET /api/activity', async () => {
    const r = await axios.get(`${BASE_URL}/api/activity`);
    if (!Array.isArray(r.data)) throw new Error('Not an array');
  });

  // Notifications Tests
  await test('GET /api/notifications', async () => {
    const r = await axios.get(`${BASE_URL}/api/notifications`);
    if (!Array.isArray(r.data)) throw new Error('Not an array');
  });

  // Catalog Tests
  await test('GET /api/catalog', async () => {
    const r = await axios.get(`${BASE_URL}/api/catalog`);
    if (!Array.isArray(r.data)) throw new Error('Not an array');
  });

  // Audit Tests
  await test('GET /api/audit', async () => {
    const r = await axios.get(`${BASE_URL}/api/audit`);
    if (!r.data) throw new Error('No data');
  });

  // Auth Tests
  await test('POST /api/auth/logout', async () => {
    const r = await axios.post(`${BASE_URL}/api/auth/logout`);
    if (!r.data.success) throw new Error('Logout failed');
  });

  await test('POST /api/auth/login (invalid creds rejected)', async () => {
    try {
      await axios.post(`${BASE_URL}/api/auth/login`, { email: 'fake', password: 'fake' });
      throw new Error('Should have rejected');
    } catch (e) {
      if (e.response && e.response.status === 401) return; // Expected
      throw new Error('Expected 401 status');
    }
  });

  // Summary
  console.log(`\n${colors.cyan}${colors.bright}=== Test Summary ===${colors.reset}`);
  console.log(`Total: ${stats.total}`);
  console.log(`${colors.green}Passed: ${stats.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${stats.failed}${colors.reset}`);
  console.log(`Pass Rate: ${((stats.passed/stats.total)*100).toFixed(1)}%\n`);

  if (stats.failed === 0) {
    console.log(`${colors.green}${colors.bright}✓ All tests passed!${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bright}✗ Some tests failed${colors.reset}\n`);
  }

  process.exit(stats.failed > 0 ? 1 : 0);
}

runTests();
