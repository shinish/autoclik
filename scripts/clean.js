#!/usr/bin/env node
/**
 * Cross-platform cleanup script
 * Author: Shinish Sasidharan
 * Removes node_modules, .next, and other temporary files
 */

const fs = require('fs');
const path = require('path');

function deleteFolder(folderPath) {
  if (fs.existsSync(folderPath)) {
    try {
      fs.rmSync(folderPath, { recursive: true, force: true });
      console.log(`✓ Deleted: ${path.basename(folderPath)}`);
      return true;
    } catch (error) {
      console.log(`⚠ Could not delete ${path.basename(folderPath)}: ${error.message}`);
      return false;
    }
  }
  return false;
}

function deleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✓ Deleted: ${path.basename(filePath)}`);
      return true;
    } catch (error) {
      console.log(`⚠ Could not delete ${path.basename(filePath)}: ${error.message}`);
      return false;
    }
  }
  return false;
}

console.log('🧹 Cleaning project...\n');

const foldersToDelete = [
  path.join(__dirname, '..', 'node_modules'),
  path.join(__dirname, '..', '.next'),
  path.join(__dirname, '..', 'dist'),
  path.join(__dirname, '..', 'build')
];

const filesToDelete = [
  path.join(__dirname, '..', 'package-lock.json'),
  path.join(__dirname, '..', '.DS_Store')
];

let deletedCount = 0;

console.log('Removing folders...');
foldersToDelete.forEach(folder => {
  if (deleteFolder(folder)) deletedCount++;
});

console.log('\nRemoving files...');
filesToDelete.forEach(file => {
  if (deleteFile(file)) deletedCount++;
});

if (deletedCount === 0) {
  console.log('\nℹ No files or folders found to clean');
} else {
  console.log(`\n✓ Cleaned ${deletedCount} item(s)`);
}

console.log('\n✨ Cleanup complete! Run "npm install" to reinstall dependencies.\n');
