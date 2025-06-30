
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing deployment...');

// Check if required files exist
const requiredFiles = [
  'dist/index.html',
  'capacitor.config.ts'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Required file missing: ${file}`);
    process.exit(1);
  }
}

// Validate capacitor config
const capacitorConfig = require('../capacitor.config.ts');
if (!capacitorConfig.appId || !capacitorConfig.appName) {
  console.error('❌ Invalid Capacitor configuration');
  process.exit(1);
}

console.log('✅ All deployment prerequisites met');
console.log(`📱 App ID: ${capacitorConfig.appId}`);
console.log(`📝 App Name: ${capacitorConfig.appName}`);
