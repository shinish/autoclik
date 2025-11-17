async function testLogin(username, password) {
  console.log(`\nTesting login for: ${username}`);
  console.log('='.repeat(50));

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: username,
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✓ Login successful!');
      console.log('Status:', response.status);
      console.log('User ID:', data.user.id);
      console.log('Name:', data.user.name);
      console.log('Email:', data.user.email);
      console.log('Role:', data.user.role);
      console.log('Department:', data.user.department || 'N/A');
      console.log('Location:', data.user.location || 'N/A');
      console.log('Message:', data.message);
    } else {
      console.log('❌ Login failed!');
      console.log('Status:', response.status);
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.log('❌ Request failed!');
    console.log('Error:', error.message);
  }
}

async function main() {
  console.log('\n📋 Testing Default Admin Account Logins');
  console.log('=' .repeat(50));

  // Test admin account
  await testLogin('admin', 'admin123');

  // Test shinish account
  await testLogin('shinish', '3Mergency!');

  // Test invalid credentials
  console.log('\n\n📋 Testing Invalid Credentials (should fail)');
  console.log('='.repeat(50));
  await testLogin('admin', 'wrongpassword');

  console.log('\n\n✅ Login API testing completed!\n');
}

main().catch(console.error);
