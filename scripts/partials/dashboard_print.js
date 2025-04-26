// partials/dashboard_print.js
module.exports = function generateDashboardPrintHTML({ totalPRMap, totalManualMap, manualData, data, classifyPR }) {
  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>PR Dashboard (Print Version)</title>
  <style>
    body { font-family: sans-serif; color: #000; background: #fff; padding: 2rem; }
    h1, h2 { margin-top: 2rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { border: 1px solid #000; padding: 8px; font-size: 14px; }
    th { background: #ddd; }
    a { color: black; text-decoration: none; }
  </style></head><body>
  <h1>📊 PR Dashboard Summary</h1>
  <h2>📉 Total PR Summary</h2>
  <table><thead><tr>
    <th>Author</th><th>Test Scripts</th><th>Workflow Updates</th><th>Script Fixes</th><th>POCs</th><th>Others</th><th>Reviews</th>
  </tr></thead><tbody>`;

  for (const author of Object.keys(totalPRMap).sort()) {
    const c = totalPRMap[author];
    html += `<tr><td>${author}</td><td>${c['Test Script']}</td><td>${c['Workflow Update']}</td><td>${c['Script Fix']}</td><td>${c['POC'] || 0}</td><td>${c['Others']}</td><td>${c['Reviews']}</td></tr>`;
  }

  html += `</tbody></table>
  <h2>📈 Manual Execution Summary</h2>
  <table><thead><tr><th>Executed By</th><th>Total</th><th>Active Days</th><th>Velocity</th></tr></thead><tbody>`;

  for (const tester of Object.keys(totalManualMap).sort()) {
    let activeDays = 0;
    for (const sprint of Object.keys(manualData)) {
      const records = manualData[sprint]?.[tester];
      if (records) {
        activeDays += Object.values(records).filter(v => v > 0).length;
      }
    }
    const total = totalManualMap[tester];
    const velocity = activeDays ? (total / activeDays).toFixed(1) : '0.0';
    html += `<tr><td>${tester}</td><td>${total}</td><td>${activeDays}</td><td>${velocity}</td></tr>`;
  }

  html += `</tbody></table>
  <h2>📛 Detailed Merged PRs</h2>
  <table><thead><tr><th>Date</th><th>Author</th><th>Type</th><th>Title</th><th>Repo</th></tr></thead><tbody>`;

  for (const pr of data.sort((a, b) => new Date(b.merged_at) - new Date(a.merged_at))) {
    const date = pr.merged_at.slice(0, 10);
    const type = classifyPR(pr.title);
    html += `<tr><td>${date}</td><td>${pr.author}</td><td>${type}</td><td>${pr.title}</td><td>${pr.repo}</td></tr>`;
  }

  html += `</tbody></table></body></html>`;
  return html;
};
