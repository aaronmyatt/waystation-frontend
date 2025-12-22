#!/usr/bin/env node

/**
 * Bump version in both jsr.json and package.json
 * Usage: node bump-version.js <major|minor|patch>
 */

import { readFileSync, writeFileSync } from 'fs';

const bumpType = process.argv[2];

if (!bumpType || !['major', 'minor', 'patch'].includes(bumpType)) {
  console.error('Usage: node bump-version.js <major|minor|patch>');
  console.error('Example: node bump-version.js patch');
  process.exit(1);
}

function bumpVersion(version, type) {
  const parts = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
      parts[2]++;
      break;
  }
  
  return parts.join('.');
}

try {
  // Read jsr.json
  const jsrJson = JSON.parse(readFileSync('jsr.json', 'utf8'));
  const oldVersion = jsrJson.version;

  if (!oldVersion) {
    console.error('Error: No version found in jsr.json');
    process.exit(1);
  }

  // Calculate new version
  const newVersion = bumpVersion(oldVersion, bumpType);

  // Update jsr.json
  jsrJson.version = newVersion;
  writeFileSync('jsr.json', JSON.stringify(jsrJson, null, 2) + '\n');

  // Read and update package.json
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  packageJson.version = newVersion;
  writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');

  console.log(`✓ Version bumped (${bumpType}): ${oldVersion} → ${newVersion}`);
  console.log('  Updated: jsr.json');
  console.log('  Updated: package.json');
} catch (error) {
  console.error('Error bumping version:', error.message);
  process.exit(1);
}
