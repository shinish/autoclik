const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking admin user...\n');

  // Check for user with username 'Shinish' or 'shinish'
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { samAccountName: 'Shinish' },
        { samAccountName: 'shinish' },
        { email: 'Shinish' },
        { email: 'shinish' }
      ]
    }
  });

  console.log('Found users:', users.length);
  users.forEach(user => {
    console.log('\nUser Details:');
    console.log('  ID:', user.id);
    console.log('  Name:', user.name);
    console.log('  Username (samAccountName):', user.samAccountName);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Enabled:', user.enabled);
    console.log('  Locked:', user.locked);
    console.log('  Approved:', user.approved);
    console.log('  Has Password:', user.password ? 'Yes' : 'No');
  });

  // List all users
  console.log('\n\nAll users in database:');
  const allUsers = await prisma.user.findMany({
    select: {
      name: true,
      samAccountName: true,
      email: true,
      role: true,
      approved: true
    }
  });
  allUsers.forEach(u => {
    console.log('  - Name:', u.name, '| Username:', u.samAccountName || u.email, '| Role:', u.role, '| Approved:', u.approved);
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
