// partials/dashboard_print.js
module.exports = function generateDashboardPrintHTML({ totalPRMap, totalManualMap, manualData, data, mergedPRs, classifyPR }) {
  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>PR Dashboard (Print Version)</title>
  <style>
    body { font-family: sans-serif; color: #000; background: #fff; padding: 2rem; }
    h1, h2 { margin-top: 2rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { border: 1px solid #000; padding: 8px; font-size: 14px; }
    th { background: #ddd; }
    a { color: black; text-decoration: none; }
    .status-closed { color: #c62828 !important; font-weight: bold; }
    .status-merged { color: #1565c0 !important; font-weight: bold; }
    .status-open { color:rgb(198, 122, 40) !important; font-weight: bold; }
  </style></head><body>
  <h1>📊 PR Dashboard Summary</h1>
  <h2>📉 Total Closed PR Summary</h2>
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
  <h2>📋 Detailed Pull Requests</h2>
  <table><thead><tr><th>Date</th><th>Author</th><th>Type</th><th>Status</th><th>Title</th><th>Repo</th></tr></thead><tbody>`;

  for (const pr of data.sort((a, b) => {
    // Sort by relevant date in this order: merged_at, closed_at, created_at
    const dateA = a.merged_at || a.closed_at || a.created_at;
    const dateB = b.merged_at || b.closed_at || b.created_at;
    return new Date(dateB) - new Date(dateA);
  })) {
    // Choose the most relevant date
    const date = pr.merged_at ? pr.merged_at.slice(0, 10) : 
                pr.closed_at ? pr.closed_at.slice(0, 10) : 
                pr.created_at.slice(0, 10);
                
    const type = classifyPR(pr.title);
    
    // Determine status class
    let statusClass = '';
    if (pr.status && pr.status.toLowerCase() === 'open') {
      statusClass = 'status-open';
    } else if (pr.status && pr.status.toLowerCase() === 'merged') {
      statusClass = 'status-merged';
    } else {
      statusClass = 'status-closed';
    }
    
    html += `<tr>
      <td>${date}</td>
      <td>${pr.author}</td>
      <td>${type}</td>
      <td><span class="${statusClass}">${pr.status || 'Unknown'}</span></td>
      <td>${pr.title}</td>
      <td>${pr.repo}</td>
    </tr>`;
  }

  html += `</tbody></table></body></html>`;
  return html;
};
