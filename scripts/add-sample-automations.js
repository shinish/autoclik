const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Adding sample automations to catalog...\n');

  // 1. Server Provisioning
  const automation1 = await prisma.automation.create({
    data: {
      name: 'Provision Linux Server',
      namespace: 'infrastructure',
      description: 'Provision and configure a new Linux server with essential packages, users, and security settings',
      keywords: JSON.stringify(['server', 'linux', 'provision', 'setup', 'infrastructure']),
      tags: JSON.stringify(['linux', 'infrastructure', 'setup']),
      formSchema: JSON.stringify([
        { type: 'text', label: 'Server Hostname', key: 'hostname', required: true, placeholder: 'server01' },
        { type: 'text', label: 'Packages to Install', key: 'packages', required: false, placeholder: 'vim,htop,curl,wget' },
        { type: 'select', label: 'Timezone', key: 'server_timezone', options: ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'], required: true },
        { type: 'textarea', label: 'Additional Users (JSON array)', key: 'users', required: false, placeholder: '[{"username":"john","groups":"sudo"}]' }
      ]),
      apiEndpoint: 'https://awx.example.com/api/v2',
      templateId: 'provision-server',
      inventoryId: 'linux-servers',
      extraVars: 'hostname: "{{form.hostname}}"\npackages: "{{form.packages}}"\nserver_timezone: "{{form.server_timezone}}"',
      customBody: JSON.stringify({
        playbook: 'playbooks/provision_server.yml',
        extra_vars: {
          hostname: '{{form.hostname}}',
          packages: '{{form.packages}}',
          server_timezone: '{{form.server_timezone}}',
          users: '{{form.users}}'
        }
      }),
      pinned: true,
      featured: true,
      runs: 0,
      createdBy: 'admin',
    },
  });
  console.log(`✓ Created: ${automation1.name}`);

  // 2. Database Backup
  const automation2 = await prisma.automation.create({
    data: {
      name: 'Database Backup',
      namespace: 'database',
      description: 'Backup MySQL or PostgreSQL databases with automatic compression and retention management',
      keywords: JSON.stringify(['database', 'backup', 'mysql', 'postgresql', 'disaster recovery']),
      tags: JSON.stringify(['database', 'backup', 'mysql', 'postgresql']),
      formSchema: JSON.stringify([
        { type: 'select', label: 'Database Type', key: 'database_type', options: ['mysql', 'postgresql'], required: true },
        { type: 'text', label: 'Database Name', key: 'database_name', required: true, placeholder: 'production_db' },
        { type: 'text', label: 'Database User', key: 'database_user', required: true, placeholder: 'root' },
        { type: 'password', label: 'Database Password', key: 'database_password', required: true },
        { type: 'text', label: 'Backup Directory', key: 'backup_directory', required: false, placeholder: '/var/backups/db' },
        { type: 'number', label: 'Retention Days', key: 'retention', required: false, placeholder: '7' },
        { type: 'checkbox', label: 'Compress Backup', key: 'compress', required: false }
      ]),
      apiEndpoint: 'https://awx.example.com/api/v2',
      templateId: 'database-backup',
      inventoryId: 'database-servers',
      extraVars: 'database_type: "{{form.database_type}}"\ndatabase_name: "{{form.database_name}}"\ndatabase_user: "{{form.database_user}}"',
      customBody: JSON.stringify({
        playbook: 'playbooks/backup_database.yml',
        extra_vars: {
          database_type: '{{form.database_type}}',
          database_name: '{{form.database_name}}',
          database_user: '{{form.database_user}}',
          database_password: '{{form.database_password}}',
          backup_directory: '{{form.backup_directory}}',
          retention: '{{form.retention}}',
          compress: '{{form.compress}}'
        }
      }),
      pinned: true,
      featured: true,
      runs: 0,
      createdBy: 'admin',
    },
  });
  console.log(`✓ Created: ${automation2.name}`);

  // 3. SSL Certificate Renewal
  const automation3 = await prisma.automation.create({
    data: {
      name: 'Renew SSL Certificate',
      namespace: 'security',
      description: 'Automatically renew Let\'s Encrypt SSL certificates for web servers with automatic cron job setup',
      keywords: JSON.stringify(['ssl', 'certificate', 'letsencrypt', 'security', 'https']),
      tags: JSON.stringify(['ssl', 'security', 'web']),
      formSchema: JSON.stringify([
        { type: 'text', label: 'Domain Name', key: 'domain', required: true, placeholder: 'example.com' },
        { type: 'email', label: 'Email Address', key: 'email', required: true, placeholder: 'admin@example.com' },
        { type: 'select', label: 'Web Server', key: 'webserver', options: ['nginx', 'apache'], required: true }
      ]),
      apiEndpoint: 'https://awx.example.com/api/v2',
      templateId: 'ssl-renewal',
      inventoryId: 'web-servers',
      extraVars: 'domain: "{{form.domain}}"\nemail: "{{form.email}}"\nwebserver: "{{form.webserver}}"',
      customBody: JSON.stringify({
        playbook: 'playbooks/renew_ssl_certificate.yml',
        extra_vars: {
          domain: '{{form.domain}}',
          email: '{{form.email}}',
          webserver: '{{form.webserver}}'
        }
      }),
      pinned: false,
      featured: true,
      runs: 0,
      createdBy: 'admin',
    },
  });
  console.log(`✓ Created: ${automation3.name}`);

  // 4. User Account Management
  const automation4 = await prisma.automation.create({
    data: {
      name: 'Manage User Accounts',
      namespace: 'system',
      description: 'Create, modify, lock, unlock, or delete user accounts with SSH key management and sudo access',
      keywords: JSON.stringify(['user', 'account', 'ssh', 'sudo', 'administration']),
      tags: JSON.stringify(['user', 'system', 'security']),
      formSchema: JSON.stringify([
        { type: 'select', label: 'Action', key: 'user_action', options: ['create', 'modify', 'lock', 'unlock', 'delete'], required: true },
        { type: 'text', label: 'Username', key: 'user_name', required: true, placeholder: 'john' },
        { type: 'text', label: 'Groups', key: 'groups', required: false, placeholder: 'users,developers' },
        { type: 'text', label: 'Shell', key: 'shell', required: false, placeholder: '/bin/bash' },
        { type: 'textarea', label: 'SSH Public Key', key: 'public_key', required: false, placeholder: 'ssh-rsa AAAA...' },
        { type: 'checkbox', label: 'Enable Sudo Access', key: 'enable_sudo', required: false }
      ]),
      apiEndpoint: 'https://awx.example.com/api/v2',
      templateId: 'user-management',
      inventoryId: 'all-servers',
      extraVars: 'user_action: "{{form.user_action}}"\nuser_name: "{{form.user_name}}"\ngroups: "{{form.groups}}"',
      customBody: JSON.stringify({
        playbook: 'playbooks/manage_user_accounts.yml',
        extra_vars: {
          user_action: '{{form.user_action}}',
          user_name: '{{form.user_name}}',
          groups: '{{form.groups}}',
          shell: '{{form.shell}}',
          public_key: '{{form.public_key}}',
          enable_sudo: '{{form.enable_sudo}}'
        }
      }),
      pinned: false,
      featured: false,
      runs: 0,
      createdBy: 'admin',
    },
  });
  console.log(`✓ Created: ${automation4.name}`);

  // 5. Security Patch Update
  const automation5 = await prisma.automation.create({
    data: {
      name: 'Apply Security Patches',
      namespace: 'security',
      description: 'Apply security patches and system updates with optional automatic reboot for Linux servers',
      keywords: JSON.stringify(['security', 'patch', 'update', 'vulnerability', 'maintenance']),
      tags: JSON.stringify(['security', 'patch', 'update']),
      formSchema: JSON.stringify([
        { type: 'select', label: 'Update Type', key: 'update_type', options: ['security', 'all'], required: true },
        { type: 'checkbox', label: 'Reboot if Required', key: 'reboot_if_required', required: false },
        { type: 'checkbox', label: 'Backup Before Update', key: 'backup_before_update', required: false }
      ]),
      apiEndpoint: 'https://awx.example.com/api/v2',
      templateId: 'security-patch',
      inventoryId: 'all-servers',
      extraVars: 'update_type: "{{form.update_type}}"\nreboot_if_required: "{{form.reboot_if_required}}"\nbackup_before_update: "{{form.backup_before_update}}"',
      customBody: JSON.stringify({
        playbook: 'playbooks/security_patch_update.yml',
        extra_vars: {
          update_type: '{{form.update_type}}',
          reboot_if_required: '{{form.reboot_if_required}}',
          backup_before_update: '{{form.backup_before_update}}'
        }
      }),
      pinned: true,
      featured: true,
      runs: 0,
      createdBy: 'admin',
    },
  });
  console.log(`✓ Created: ${automation5.name}`);

  console.log('\n✅ Successfully added 5 sample automations to the catalog!');
  console.log('\nYou can now view them in the Catalog page of the application.');
}

main()
  .catch((e) => {
    console.error('Error adding automations:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
