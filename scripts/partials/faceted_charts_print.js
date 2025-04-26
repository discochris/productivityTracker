// partials/faceted_charts_print.js
module.exports = function generateFacetedChartsPrintHTML({ sprintMap, manualData }) {
  const authors = [...new Set(Object.values(sprintMap).flatMap(obj => Object.keys(obj)))];
  const sprints = Object.keys(sprintMap).sort();
  const manualTesters = [...new Set(Object.values(manualData).flatMap(Object.keys))];

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Faceted Charts (Printable)</title>
  <style>
    body { font-family: Arial, sans-serif; background: #fff; color: #000; padding: 40px; }
    h1, h2, h4 { margin-top: 40px; color: #000; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #aaa; padding: 6px 10px; text-align: left; }
    th { background: #f0f0f0; }
  </style></head><body>
  <h1>📊 Faceted PR Activity Summary</h1>`;

  for (const author of authors.sort()) {
    html += `<h4>👤 ${author}</h4>
    <table><thead><tr><th>Sprint</th><th>Test Scripts</th><th>Workflow Updates</th><th>Script Fixes</th><th>POCs</th><th>Others</th><th>Reviews</th></tr></thead><tbody>`;
    for (const sprint of sprints) {
      const c = sprintMap[sprint]?.[author] || {};
      html += `<tr><td>${sprint}</td><td>${c['Test Script'] || 0}</td><td>${c['Workflow Update'] || 0}</td><td>${c['Script Fix'] || 0}</td><td>${c['POC'] || 0}</td><td>${c['Others'] || 0}</td><td>?</td></tr>`;
    }
    html += `</tbody></table>`;
  }

  html += `<h2>🧪 Manual Execution Summary</h2>`;

  for (const tester of manualTesters.sort()) {
    html += `<h4>${tester}</h4><table><thead><tr><th>Sprint</th><th>Total</th><th>Active Days</th><th>Velocity</th></tr></thead><tbody>`;
    for (const sprint of sprints) {
      const days = manualData[sprint]?.[tester] || {};
      const total = Object.values(days).reduce((a, b) => a + b, 0);
      const active = Object.values(days).filter(v => v > 0).length;
      const velocity = active ? (total / active).toFixed(1) : '0.0';
      html += `<tr><td>${sprint}</td><td>${total}</td><td>${active}</td><td>${velocity}</td></tr>`;
    }
    html += `</tbody></table>`;
  }

  html += `</body></html>`;
  return html;
};
