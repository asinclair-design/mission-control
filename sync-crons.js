#!/usr/bin/env node
/**
 * Sync OpenClaw cron jobs to Convex
 */

const fs = require('fs');
const path = require('path');

// Read the export file
const exportPath = path.join(__dirname, 'openclaw-crons-export.clean.json');
const data = JSON.parse(fs.readFileSync(exportPath, 'utf8'));

console.log('Jobs to sync:', data.jobs.length);
console.log('\nStatus summary:');
const byStatus = {};
for (const job of data.jobs) {
  const status = job.status || 'unknown';
  byStatus[status] = (byStatus[status] || 0) + 1;
  if (job.lastError) {
    console.log(`  ❌ ${job.name}: ${job.lastError.substring(0, 80)}...`);
  } else {
    console.log(`  ✅ ${job.name}: ${status}`);
  }
}

console.log('\nRun this to sync to Convex:');
console.log('npx convex run cronJobs:upsertMany --stdin < openclaw-crons-export.clean.json');
