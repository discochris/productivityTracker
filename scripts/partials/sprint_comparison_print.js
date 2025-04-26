// partials/sprint_comparison_print.js
module.exports = function generateSprintComparisonPrintHTML({ sprintMap, reviewData, manualData, getSprintStart }) {
  const sprintKeys = Object.keys(sprintMap).sort();

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Sprint Comparison (Printable)</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #fff; color: #000; padding: 40px; }
    h1, h2, h4 { margin-top: 40px; color: #000; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #999; padding: 6px 10px; text-align: left; }
    th { background: #eee; }
  </style></head><body>
  <h1>📊 Sprint-over-Sprint Comparison</h1>`;

  for (const sprint of sprintKeys.reverse()) {
    html += `<h2>📅 Sprint: ${sprint}</h2>`;
    html += `<h4>✅ Merged PR Summary & Review Activity</h4>
    <table><thead><tr><th>Author</th><th>Test Scripts</th><th>Workflow Updates</th><th>Script Fixes</th><th>POCs</th><th>Others</th><th>Reviews</th></tr></thead><tbody>`;

    for (const author of Object.keys(sprintMap[sprint]).sort()) {
      const c = sprintMap[sprint][author];
      const reviewCount = Object.entries(reviewData[author] || {}).reduce((sum, [date, count]) => {
        const { start, end } = getSprintStart(date);
        return sprint === `${start} to ${end}` ? sum + count : sum;
      }, 0);
      html += `<tr><td>${author}</td><td>${c['Test Script']}</td><td>${c['Workflow Update']}</td><td>${c['Script Fix']}</td><td>${c['POC'] || 0}</td><td>${c['Others']}</td><td>${reviewCount}</td></tr>`;
    }
    html += `</tbody></table>`;

    if (manualData[sprint]) {
      const allDates = new Set();
      Object.values(manualData[sprint]).forEach(user => Object.keys(user).forEach(d => allDates.add(d)));
      const sortedDates = [...allDates].sort();

      html += `<h4>🧪 Manual Execution Summary</h4>
      <table><thead><tr><th>Executed by</th>`;
      for (const d of sortedDates) html += `<th>${d}</th>`;
      html += `<th>Total</th><th>Active Days</th><th>Velocity</th></tr></thead><tbody>`;

      for (const tester of Object.keys(manualData[sprint]).sort()) {
        const days = manualData[sprint][tester];
        let total = 0;
        let activeDays = 0;
        html += `<tr><td>${tester}</td>`;
        for (const d of sortedDates) {
          const count = days[d] || 0;
          if (count > 0) activeDays++;
          html += `<td>${count}</td>`;
          total += count;
        }
        const velocity = activeDays ? (total / activeDays).toFixed(1) : '0.0';
        html += `<td>${total}</td><td>${activeDays}</td><td>${velocity}</td></tr>`;
      }

      html += `</tbody></table>`;
    }
  }

  html += `</body></html>`;
  return html;
};