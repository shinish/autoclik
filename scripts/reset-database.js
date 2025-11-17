#!/usr/bin/env node
/**
 * Cross-platform database reset script
 * Author: Shinish Sasidharan
 * Works on Windows, macOS, and Linux
 */

const fs = require('fs');
const path = require('path');

const dbFiles = [
  path.join(__dirname, '..', 'prisma', 'dev.db'),
  path.join(__dirname, '..', 'prisma', 'dev.db-journal'),
  path.join(__dirname, '..', 'dev.db'),
  path.join(__dirname, '..', 'dev.db-journal')
];

console.log('🗑️  Removing old database files...\n');

let filesDeleted = 0;
dbFiles.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✓ Deleted: ${path.basename(filePath)}`);
      filesDeleted++;
    }
  } catch (error) {
    console.log(`⚠ Could not delete ${path.basename(filePath)}: ${error.message}`);
  }
});

if (filesDeleted === 0) {
  console.log('ℹ No database files found to delete');
} else {
  console.log(`\n✓ Removed ${filesDeleted} file(s)`);
}

console.log('\n📦 Database files cleaned. Ready for fresh setup.\n');
