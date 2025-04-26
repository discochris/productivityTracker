const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { config } = require('./config.js');

// Load Excel file
const workbook = xlsx.readFile('./data/manual_testcases.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet);

// Prepare output structure
const grouped = {};

function getSprintStart(date) {
  const d = new Date(date);
  const epoch = new Date(config.startDate);
  const daysDiff = Math.floor((d - epoch) / (1000 * 60 * 60 * 24));
  const sprintIndex = Math.floor(daysDiff / 14);
  const sprintStart = new Date(epoch.getTime() + sprintIndex * 14 * 86400000);
  const sprintEnd = new Date(sprintStart.getTime() + 13 * 86400000);
  return `${sprintStart.toISOString().slice(0, 10)} to ${sprintEnd.toISOString().slice(0, 10)}`;
}

const start = new Date(config.startDate);
const end = new Date(config.endDate);

for (const row of rows) {
  const tester = row['Executed By'];
  const dateStr = row['Executed On - UTC'];
  if (!tester || !dateStr) continue;

  const executedOn = new Date(dateStr);
  if (isNaN(executedOn) || executedOn < start || executedOn > end) continue;

  const sprint = getSprintStart(executedOn);
  const dateKey = executedOn.toISOString().slice(0, 10);

  grouped[sprint] ??= {};
  grouped[sprint][tester] ??= {};
  grouped[sprint][tester][dateKey] = (grouped[sprint][tester][dateKey] || 0) + 1;
}

// Write to file
fs.writeFileSync(
  path.join(__dirname, '../data/manual_test_summary.json'),
  JSON.stringify(grouped, null, 2)
);

console.log('✅ Manual test summary parsed and written to data/manual_test_summary.json');