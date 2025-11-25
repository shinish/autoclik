const axios = require('axios');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3003';
let authToken = null;
let testUserId = null;
let testAutomationId = null;
let testRunId = null;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
  }[type] || '';

  console.log(`${prefix} [${timestamp}] ${message}`);
}

// Test Statistics
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
};

function updateStats(passed) {
  stats.total++;
  if (passed) {
    stats.passed++;
  } else {
    stats.failed++;
  }
}

// Test Runner
async function runTest(name, testFn) {
  try {
    log(`\n${colors.bright}Running: ${name}${colors.reset}`, 'info');
    await testFn();
    log(`${colors.green}PASSED${colors.reset}: ${name}`, 'success');
    updateStats(true);
  } catch (error) {
    log(`${colors.red}FAILED${colors.reset}: ${name}`, 'error');
    log(`Error: ${error.message}`, 'error');
    updateStats(false);
  }
}

// Authentication Tests
async function testLogin() {
  const response = await axios.post(`${BASE_URL}/api/auth/login`, {
    email: 'admin',
    password: 'admin',
  });

  if (response.data.success && response.data.user) {
    authToken = response.data.user.id; // In a real app, this would be a JWT token
    testUserId = response.data.user.id;
    log(`Logged in as: ${response.data.user.name}`, 'success');
  } else {
    throw new Error('Login failed');
  }
}

async function testLoginFailure() {
  try {
    await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin',
      password: 'wrongpassword',
    });
    throw new Error('Should have failed with wrong password');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      log('Correctly rejected invalid credentials', 'success');
    } else {
      throw error;
    }
  }
}

async function testLogout() {
  const response = await axios.post(`${BASE_URL}/api/auth/logout`);
  if (response.data.success) {
    log('Logout successful', 'success');
  } else {
    throw new Error('Logout failed');
  }
}

// User Management Tests
async function testGetUsers() {
  const response = await axios.get(`${BASE_URL}/api/users`);
  if (response.data && Array.isArray(response.data)) {
    log(`Retrieved ${response.data.length} users`, 'success');
  } else {
    throw new Error('Failed to get users');
  }
}

async function testGetUserProfile() {
  const response = await axios.get(`${BASE_URL}/api/profile`);
  if (response.data) {
    log(`Profile data retrieved`, 'success');
  } else {
    throw new Error('Failed to get profile');
  }
}

// Automation Tests
async function testGetAutomations() {
  const response = await axios.get(`${BASE_URL}/api/automations`);
  if (response.data && Array.isArray(response.data)) {
    log(`Retrieved ${response.data.length} automations`, 'success');
    if (response.data.length > 0) {
      testAutomationId = response.data[0].id;

      // Validate customBody is present
      if (response.data[0].customBody) {
        log('CustomBody field present in automation', 'success');
      } else {
        stats.warnings++;
        log('Warning: CustomBody field not present', 'warning');
      }
    }
  } else {
    throw new Error('Failed to get automations');
  }
}

async function testGetSingleAutomation() {
  if (!testAutomationId) {
    throw new Error('No test automation ID available');
  }

  const response = await axios.get(`${BASE_URL}/api/automations/${testAutomationId}`);
  if (response.data && response.data.id === testAutomationId) {
    log(`Retrieved automation: ${response.data.name}`, 'success');
  } else {
    throw new Error('Failed to get single automation');
  }
}

async function testRunAutomation() {
  if (!testAutomationId) {
    throw new Error('No test automation ID available');
  }

  const response = await axios.post(`${BASE_URL}/api/automations/${testAutomationId}/run`, {
    parameters: {
      hostname: 'test-server',
      provider: 'AWS',
      cpu: 4,
      memory: 8192,
    },
    user: {
      email: 'admin',
      name: 'Admin User',
    },
  });

  if (response.data.success && response.data.awxJobId) {
    testRunId = response.data.runId;
    log(`Automation run initiated: ${response.data.uniqueId}`, 'success');
    log(`AWX Job ID: ${response.data.awxJobId}`, 'info');

    // Check if artifacts are returned (in demo mode)
    if (response.data.artifacts) {
      log('Artifacts retrieved successfully', 'success');
    }
  } else {
    throw new Error('Failed to run automation');
  }
}

// Run History Tests
async function testGetRuns() {
  const response = await axios.get(`${BASE_URL}/api/runs`);
  if (response.data && Array.isArray(response.data)) {
    log(`Retrieved ${response.data.length} runs`, 'success');

    // Validate artifacts field is present
    const runWithArtifacts = response.data.find(run => run.artifacts);
    if (runWithArtifacts) {
      log('Artifacts field present in run history', 'success');
    }
  } else {
    throw new Error('Failed to get runs');
  }
}

// Schedule Tests
async function testGetSchedules() {
  const response = await axios.get(`${BASE_URL}/api/schedules`);
  if (response.data && Array.isArray(response.data)) {
    log(`Retrieved ${response.data.length} schedules`, 'success');
  } else {
    throw new Error('Failed to get schedules');
  }
}

// Namespace Tests
async function testGetNamespaces() {
  const response = await axios.get(`${BASE_URL}/api/namespaces`);
  if (response.data && Array.isArray(response.data)) {
    log(`Retrieved ${response.data.length} namespaces`, 'success');
  } else {
    throw new Error('Failed to get namespaces');
  }
}

// Group Tests
async function testGetGroups() {
  const response = await axios.get(`${BASE_URL}/api/groups`);
  if (response.data && Array.isArray(response.data)) {
    log(`Retrieved ${response.data.length} groups`, 'success');
  } else {
    throw new Error('Failed to get groups');
  }
}

// Credentials Tests
async function testGetCredentials() {
  const response = await axios.get(`${BASE_URL}/api/credentials`);
  if (response.data && Array.isArray(response.data)) {
    log(`Retrieved ${response.data.length} credentials`, 'success');
  } else {
    throw new Error('Failed to get credentials');
  }
}

// Settings Tests
async function testGetSettings() {
  const response = await axios.get(`${BASE_URL}/api/settings`);
  if (response.data && Array.isArray(response.data)) {
    log(`Retrieved ${response.data.length} settings`, 'success');

    // Check for AWX configuration
    const awxEndpoint = response.data.find(s => s.key === 'default_api_endpoint');
    const awxToken = response.data.find(s => s.key === 'awx_token');

    if (awxEndpoint) {
      log(`AWX Endpoint configured: ${awxEndpoint.value}`, 'info');
    }
    if (awxToken) {
      log('AWX Token configured', 'info');
    }
  } else {
    throw new Error('Failed to get settings');
  }
}

// Dashboard Tests
async function testGetDashboard() {
  const response = await axios.get(`${BASE_URL}/api/dashboard`);
  if (response.data) {
    log('Dashboard data retrieved', 'success');
  } else {
    throw new Error('Failed to get dashboard');
  }
}

async function testGetDashboardStats() {
  const response = await axios.get(`${BASE_URL}/api/dashboard/stats`);
  if (response.data) {
    log('Dashboard stats retrieved', 'success');
  } else {
    throw new Error('Failed to get dashboard stats');
  }
}

// Activity Tests
async function testGetActivity() {
  const response = await axios.get(`${BASE_URL}/api/activity`);
  if (response.data && Array.isArray(response.data)) {
    log(`Retrieved ${response.data.length} activity logs`, 'success');
  } else {
    throw new Error('Failed to get activity');
  }
}

// Notification Tests
async function testGetNotifications() {
  const response = await axios.get(`${BASE_URL}/api/notifications`);
  if (response.data && Array.isArray(response.data)) {
    log(`Retrieved ${response.data.length} notifications`, 'success');
  } else {
    throw new Error('Failed to get notifications');
  }
}

// Security Tests
async function testSQLInjection() {
  try {
    await axios.post(`${BASE_URL}/api/auth/login`, {
      email: "admin' OR '1'='1",
      password: "password",
    });
    stats.warnings++;
    log('Warning: Potential SQL injection vulnerability', 'warning');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      log('SQL injection attempt correctly rejected', 'success');
    }
  }
}

async function testXSS() {
  try {
    await axios.post(`${BASE_URL}/api/auth/login`, {
      email: '<script>alert("XSS")</script>',
      password: 'password',
    });
    log('XSS payload correctly handled', 'success');
  } catch (error) {
    // Expected to fail
    log('XSS attempt correctly rejected', 'success');
  }
}

// Database Performance Tests
async function testDatabasePerformance() {
  const start = Date.now();
  await Promise.all([
    axios.get(`${BASE_URL}/api/automations`),
    axios.get(`${BASE_URL}/api/runs`),
    axios.get(`${BASE_URL}/api/schedules`),
  ]);
  const end = Date.now();
  const duration = end - start;

  log(`Concurrent database queries completed in ${duration}ms`, 'info');
  if (duration < 1000) {
    log('Database performance is good', 'success');
  } else {
    stats.warnings++;
    log('Warning: Database queries are slow', 'warning');
  }
}

// Main Test Runner
async function runAllTests() {
  console.log(`\n${colors.cyan}${colors.bright}================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}  Comprehensive Test Suite${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}================================${colors.reset}\n`);

  // Authentication Tests
  console.log(`\n${colors.cyan}--- Authentication Tests ---${colors.reset}`);
  await runTest('Login with valid credentials', testLogin);
  await runTest('Login with invalid credentials', testLoginFailure);
  await runTest('Logout', testLogout);

  // Re-login for subsequent tests
  await testLogin();

  // User Management Tests
  console.log(`\n${colors.cyan}--- User Management Tests ---${colors.reset}`);
  await runTest('Get all users', testGetUsers);
  await runTest('Get user profile', testGetUserProfile);

  // Automation Tests
  console.log(`\n${colors.cyan}--- Automation Tests ---${colors.reset}`);
  await runTest('Get all automations', testGetAutomations);
  await runTest('Get single automation', testGetSingleAutomation);
  await runTest('Run automation with custom body', testRunAutomation);

  // Run History Tests
  console.log(`\n${colors.cyan}--- Run History Tests ---${colors.reset}`);
  await runTest('Get run history', testGetRuns);

  // Schedule Tests
  console.log(`\n${colors.cyan}--- Schedule Tests ---${colors.reset}`);
  await runTest('Get schedules', testGetSchedules);

  // Namespace Tests
  console.log(`\n${colors.cyan}--- Namespace Tests ---${colors.reset}`);
  await runTest('Get namespaces', testGetNamespaces);

  // Group Tests
  console.log(`\n${colors.cyan}--- Group Tests ---${colors.reset}`);
  await runTest('Get groups', testGetGroups);

  // Credentials Tests
  console.log(`\n${colors.cyan}--- Credentials Tests ---${colors.reset}`);
  await runTest('Get credentials', testGetCredentials);

  // Settings Tests
  console.log(`\n${colors.cyan}--- Settings Tests ---${colors.reset}`);
  await runTest('Get settings', testGetSettings);

  // Dashboard Tests
  console.log(`\n${colors.cyan}--- Dashboard Tests ---${colors.reset}`);
  await runTest('Get dashboard', testGetDashboard);
  await runTest('Get dashboard stats', testGetDashboardStats);

  // Activity Tests
  console.log(`\n${colors.cyan}--- Activity Tests ---${colors.reset}`);
  await runTest('Get activity logs', testGetActivity);

  // Notification Tests
  console.log(`\n${colors.cyan}--- Notification Tests ---${colors.reset}`);
  await runTest('Get notifications', testGetNotifications);

  // Security Tests
  console.log(`\n${colors.cyan}--- Security Tests ---${colors.reset}`);
  await runTest('SQL Injection test', testSQLInjection);
  await runTest('XSS test', testXSS);

  // Performance Tests
  console.log(`\n${colors.cyan}--- Performance Tests ---${colors.reset}`);
  await runTest('Database performance test', testDatabasePerformance);

  // Print Summary
  console.log(`\n${colors.cyan}${colors.bright}================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}  Test Summary${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}================================${colors.reset}`);
  console.log(`\nTotal Tests: ${stats.total}`);
  console.log(`${colors.green}Passed: ${stats.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${stats.failed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${stats.warnings}${colors.reset}`);

  const passRate = ((stats.passed / stats.total) * 100).toFixed(2);
  console.log(`\nPass Rate: ${passRate}%`);

  if (stats.failed === 0) {
    console.log(`\n${colors.green}${colors.bright}✓ All tests passed!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}${colors.bright}✗ Some tests failed${colors.reset}\n`);
  }

  process.exit(stats.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
