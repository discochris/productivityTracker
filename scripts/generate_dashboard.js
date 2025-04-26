// generate_dashboard.js (updated to also create _print.html versions)
const fs = require('fs');
const path = require('path');
const fs = require('fs');
const path = require('path');

let data = [];
const mergedPrsPath = path.join(__dirname, '../data/merged_prs.json');
if (fs.existsSync(mergedPrsPath)) {
  data = JSON.parse(fs.readFileSync(mergedPrsPath, 'utf-8'));
} else {
  console.error('❌ Error: merged_prs.json not found. Please run fetch_prs.js first.');
  process.exit(1);
}
const { config } = require('./config.js');

function formatReadableDate(isoDate) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(isoDate).toLocaleDateString('en-US', options);
}

const reviewData = fs.existsSync('./data/review_activity.json') ? JSON.parse(fs.readFileSync('./data/review_activity.json')) : {};
const manualData = fs.existsSync('./data/manual_test_summary.json') ? JSON.parse(fs.readFileSync('./data/manual_test_summary.json')) : {};

function getSprintStart(date) {
  const d = new Date(date);
  const epoch = new Date(config.startDate);
  const daysDiff = Math.floor((d - epoch) / (1000 * 60 * 60 * 24));
  const sprintIndex = Math.floor(daysDiff / 14);
  const sprintStart = new Date(epoch.getTime() + sprintIndex * 14 * 86400000);
  const sprintEnd = new Date(sprintStart.getTime() + 13 * 86400000);
  return { start: sprintStart.toISOString().slice(0, 10), end: sprintEnd.toISOString().slice(0, 10) };
}

const classifyPR = (title) => {
  const lower = title.toLowerCase();
  if (lower.includes('fix')) return 'Script Fix';
  if (lower.includes('poc')) return 'POC';
  if (title.startsWith('GQA-') || title.includes('GQA-TC-') || lower.includes('test script')) return 'Test Script';
  if (lower.includes('workflow update') || lower.includes('workflow')) return 'Workflow Update';
  return 'Others';
};

const generateDashboardHTML = require('./partials/dashboard');
const generateSprintComparisonHTML = require('./partials/sprint_comparison');
const generateFacetedChartsHTML = require('./partials/faceted_charts');
const generateDashboardPrintHTML = require('./partials/dashboard_print');
const generateSprintComparisonPrintHTML = require('./partials/sprint_comparison_print');
const generateFacetedChartsPrintHTML = require('./partials/faceted_charts_print');

const outputDir = path.join(__dirname, '../public');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Aggregation phase
const sprintMap = {}, totalPRMap = {}, totalManualMap = {};
for (const pr of data) {
  const mergedDate = pr.merged_at.slice(0, 10);
  const { start, end } = getSprintStart(mergedDate);
  const sprintKey = `${start} to ${end}`;
  const author = pr.author;
  const type = classifyPR(pr.title);

  sprintMap[sprintKey] ??= {};
  sprintMap[sprintKey][author] ??= { 'Test Script': 0, 'Workflow Update': 0, 'Script Fix': 0, 'POC': 0, 'Others': 0 };
  sprintMap[sprintKey][author][type]++;

  totalPRMap[author] ??= { 'Test Script': 0, 'Workflow Update': 0, 'Script Fix': 0, 'POC': 0, 'Others': 0, 'Reviews': 0 };
  totalPRMap[author][type]++;
}

for (const [author, reviews] of Object.entries(reviewData)) {
  for (const [date, count] of Object.entries(reviews)) {
    const { start, end } = getSprintStart(date);
    const sprintKey = `${start} to ${end}`;
    sprintMap[sprintKey] ??= {};
    sprintMap[sprintKey][author] ??= { 'Test Script': 0, 'Workflow Update': 0, 'Script Fix': 0, 'POC': 0, 'Others': 0 };
    totalPRMap[author] ??= { 'Test Script': 0, 'Workflow Update': 0, 'Script Fix': 0, 'POC': 0, 'Others': 0, 'Reviews': 0 };
    totalPRMap[author]['Reviews'] += count;
  }
}

const end = new Date(config.endDate);
const start = new Date(config.startDate);

for (const [sprint, testers] of Object.entries(manualData)) {
  const sprintStart = new Date(sprint.split(" to ")[0]);
  if (sprintStart < start || sprintStart > end) continue;

  for (const [tester, dailyCounts] of Object.entries(testers)) {
    const total = Object.values(dailyCounts).reduce((a, b) => a + b, 0);
    totalManualMap[tester] = (totalManualMap[tester] || 0) + total;
  }
}

const readableStartDate = formatReadableDate(config.startDate);

fs.writeFileSync(
  path.join(outputDir, 'dashboard.html'),
  generateDashboardHTML({ totalPRMap, totalManualMap, manualData, data, classifyPR, readableStartDate,config, })
);
fs.writeFileSync(path.join(outputDir, 'sprint_comparison.html'), generateSprintComparisonHTML({ sprintMap, reviewData, manualData, getSprintStart }));
fs.writeFileSync(path.join(outputDir, 'faceted_charts.html'), generateFacetedChartsHTML({ sprintMap, reviewData, manualData, getSprintStart }));

// === PRINTABLE VERSIONS ===
fs.writeFileSync(path.join(outputDir, 'dashboard_print.html'), generateDashboardPrintHTML({ totalPRMap, totalManualMap, manualData, data, classifyPR }));
fs.writeFileSync(path.join(outputDir, 'sprint_comparison_print.html'), generateSprintComparisonPrintHTML({ sprintMap, reviewData, manualData, getSprintStart }));
fs.writeFileSync(path.join(outputDir, 'faceted_charts_print.html'), generateFacetedChartsPrintHTML({ sprintMap, reviewData, manualData, getSprintStart }));
console.log('✅ All dashboards and printable versions generated.');