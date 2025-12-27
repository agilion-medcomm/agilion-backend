#!/usr/bin/env node
/**
 * Production Startup Script for Render.com
 * 
 * This script handles the complete production startup sequence:
 * 1. Runs Prisma migrations (npx prisma migrate deploy)
 * 2. Seeds the database with initial data (if needed)
 * 3. Starts the Express server
 * 
 * Usage: node scripts/production-start.js
 * Set as Render start command: node scripts/production-start.js
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
// Ensure env vars are loaded exclusively for this script execution
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bright}[${step}]${colors.reset} ${colors.cyan}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

async function runCommand(command, description) {
  try {
    logStep('RUNNING', description);
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
      env: process.env
    });
    logSuccess(`${description} completed successfully`);
    return true;
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    return false;
  }
}

async function checkDatabaseConnection() {
  logStep('CHECK', 'Testing database connection...');
  try {
    const prisma = require('../src/config/db');
    await prisma.$connect();
    await prisma.$disconnect();
    logSuccess('Database connection successful');
    return true;
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    return false;
  }
}

async function shouldSeedDatabase() {
  logStep('CHECK', 'Checking if database needs seeding...');
  try {
    const prisma = require('../src/config/db');
    const userCount = await prisma.user.count();
    await prisma.$disconnect();
    
    if (userCount === 0) {
      logWarning('Database is empty, seeding is recommended');
      return true;
    } else {
      log(`Database already has ${userCount} users, skipping seed`);
      return false;
    }
  } catch (error) {
    logWarning(`Could not check database status: ${error.message}`);
    logWarning('Skipping seed to be safe');
    return false;
  }
}

async function startServer() {
  logStep('START', 'Starting Express server...');
  
  const serverProcess = spawn('node', ['src/server.js'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: process.env
  });

  serverProcess.on('error', (error) => {
    logError(`Server failed to start: ${error.message}`);
    process.exit(1);
  });

  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      logError(`Server exited with code ${code}`);
      process.exit(code);
    }
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    log('\nReceived SIGTERM, shutting down gracefully...');
    serverProcess.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    log('\nReceived SIGINT, shutting down gracefully...');
    serverProcess.kill('SIGINT');
  });
}

async function main() {
  log('\n' + '═'.repeat(60), colors.bright);
  log('  AGILION BACKEND - PRODUCTION STARTUP', colors.bright);
  log('═'.repeat(60) + '\n', colors.bright);
  
  log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  log(`Database: ${process.env.DATABASE_URL ? '✓ Configured' : '✗ Not configured'}`);
  log(`Port: ${process.env.PORT || 3000}\n`);

  // Step 1: Check database connection
  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    logError('Cannot proceed without database connection');
    process.exit(1);
  }

  // Step 2: Sync database schema
  // Try migrate deploy first (if migration files exist)
  // If that fails, use db push (works without migration files)
  let schemaSuccess = await runCommand(
    'npx prisma migrate deploy',
    'Running database migrations'
  );
  
  if (!schemaSuccess) {
    logWarning('Migration deploy failed (likely no migration files)');
    logStep('FALLBACK', 'Using prisma db push to sync schema...');
    
    schemaSuccess = await runCommand(
      'npx prisma db push --accept-data-loss',
      'Pushing schema to database'
    );
    
    if (!schemaSuccess) {
      logError('Both migration deploy and db push failed!');
      logError('Cannot proceed without database schema');
      process.exit(1);
    }
  }

  // Step 3: Generate Prisma Client (ensures it's up to date)
  await runCommand(
    'npx prisma generate',
    'Generating Prisma Client'
  );

  // Step 4: Seed database if needed
  const needsSeed = await shouldSeedDatabase();
  if (needsSeed) {
    const seedSuccess = await runCommand(
      'node scripts/seedDatabase.js',
      'Seeding database with initial data'
    );
    
    if (!seedSuccess) {
      logWarning('Database seeding failed, but continuing...');
      logWarning('You may need to seed manually or check logs');
    }
  }

  // Step 5: Start the server
  log('\n' + '═'.repeat(60), colors.bright);
  log('  STARTUP SEQUENCE COMPLETE', colors.green);
  log('═'.repeat(60) + '\n', colors.bright);
  
  await startServer();
}

// Run the startup sequence
main().catch((error) => {
  logError(`Fatal error during startup: ${error.message}`);
  console.error(error);
  process.exit(1);
});
