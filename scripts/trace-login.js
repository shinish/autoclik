const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function simulateLogin(email, password) {
  console.log('\n='.repeat(60));
  console.log('SIMULATING LOGIN API FLOW');
  console.log('='.repeat(60));
  console.log('Input email:', email);
  console.log('Input password:', password);

  // Step 1: Find user
  console.log('\nStep 1: Finding user...');
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email },
        { samAccountName: email }
      ]
    }
  });

  if (!user) {
    console.log('❌ User not found');
    return { error: 'Invalid credentials', status: 401 };
  }
  console.log('✓ User found:', user.name);

  // Step 2: Check password
  console.log('\nStep 2: Checking password...');
  if (!user.password) {
    console.log('❌ No password set');
    return { error: 'Account not configured', status: 401 };
  }
  console.log('✓ Password field exists');

  // Step 3: Verify password
  console.log('\nStep 3: Verifying password...');
  const isPasswordValid = await bcrypt.compare(password, user.password);
  console.log('Password valid:', isPasswordValid);

  if (!isPasswordValid) {
    console.log('❌ Password invalid');
    return { error: 'Invalid credentials', status: 401 };
  }
  console.log('✓ Password verified');

  // Step 4: Check locked
  console.log('\nStep 4: Checking if account is locked...');
  console.log('Locked:', user.locked);
  if (user.locked) {
    console.log('❌ Account is locked');
    return { error: 'Account is locked', status: 403 };
  }
  console.log('✓ Not locked');

  // Step 5: Check enabled
  console.log('\nStep 5: Checking if account is enabled...');
  console.log('Enabled:', user.enabled);
  if (!user.enabled) {
    console.log('❌ Account is disabled');
    return { error: 'Account is disabled', status: 403 };
  }
  console.log('✓ Enabled');

  // Step 6: Check approved
  console.log('\nStep 6: Checking if account is approved...');
  console.log('Approved field value:', user.approved);
  console.log('Approved field type:', typeof user.approved);
  console.log('Approved by:', user.approvedBy);
  console.log('Approved at:', user.approvedAt);

  if (!user.approved) {
    console.log('❌ Account is NOT approved');
    return { error: 'Account is pending admin approval', status: 403 };
  }
  console.log('✓ Approved');

  // Success
  console.log('\n✅ LOGIN SUCCESSFUL!');
  return { success: true, user: user };
}

async function main() {
  // Test admin account
  await simulateLogin('admin', 'admin123');

  // Test shinish account
  await simulateLogin('shinish', '3Mergency!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
