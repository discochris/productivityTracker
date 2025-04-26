// partials/sprint_comparison.js
module.exports = function generateSprintComparisonHTML({ sprintMap, reviewData, manualData, getSprintStart }) {
  const sprintKeys = Object.keys(sprintMap).sort();
  const authors = [...new Set(Object.values(sprintMap).flatMap(obj => Object.keys(obj)))];
  const manualTesters = [...new Set(Object.values(manualData).flatMap(Object.keys))];

  const prChartData = sprintKeys.map(sprint => {
    return {
      label: sprint,
      data: authors.map(author => {
        const counts = sprintMap[sprint]?.[author] || {
  'Test Script': 0, 'Workflow Update': 0, 'Script Fix': 0, 'POC': 0, 'Others': 0
};
        const reviewCount = Object.entries(reviewData[author] || {}).reduce((sum, [date, count]) => {
          const { start, end } = getSprintStart(date);
          return sprint === `${start} to ${end}` ? sum + count : sum;
        }, 0);
        return counts['Test Script'] + counts['Workflow Update'] + counts['Script Fix'] + counts['Others'] + reviewCount;
      })
    };
  });

  const manualChartData = sprintKeys.map(sprint => {
    return {
      label: sprint,
      data: manualTesters.map(author => {
        const records = manualData[sprint]?.[author] || {};
        const total = Object.values(records).reduce((a, b) => a + b, 0);
        const customDays = Object.values(records).filter(x => x > 0).length || 1;
        const velocity = (total / customDays).toFixed(1);
        return parseFloat((total).toFixed(1));
      })
    };
  });

  let html = `
  <!DOCTYPE html><html><head>
  <meta charset="UTF-8">
  <title>Sprint Comparison</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
  body { background-color: #121212; color: white; font-family: 'Segoe UI', Roboto, sans-serif; }
  h1, h2, h4 { color: #ffffff; }
  .table, .table-striped tbody tr:nth-of-type(odd) { background-color: #1e1e1e; }
  .table thead th { background-color: #333; color: #fff; }
  .table td, .table th { border-color: #444; }
  a.btn { margin-top: 20px; }
  </style></head><body class="p-4">
  <div class="container">
  <a href="dashboard.html" class="btn btn-outline-light mb-4">← Back to Dashboard</a>
  <a href="faceted_charts.html" class="btn btn-secondary mb-4 ms-3">View Faceted PR & Manual Charts →</a>
  <h1 class="mb-4">📊 Sprint-over-Sprint Comparison</h1>
  <canvas id="prChart" height="150"></canvas>
  <canvas id="manualChart" height="150"></canvas>
  <script>
    const ctx1 = document.getElementById('prChart').getContext('2d');
    new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(authors)},
        datasets: ${JSON.stringify(prChartData)}.map((s, i) => ({
          label: s.label,
          data: s.data,
          backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#4bc0c0', '#ffa600', '#8884d8'][i % 6]
        }))
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Total PRs + Reviews by Author', color: '#ffffff' },
          legend: { labels: { color: '#ffffff' } }
        },
        scales: {
          x: { ticks: { color: '#ffffff' }, grid: { color: '#444444' } },
          y: { ticks: { color: '#ffffff' }, grid: { color: '#444444' } }
        }
      }
    });

    const ctx2 = document.getElementById('manualChart').getContext('2d');
    new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(manualTesters)},
        datasets: ${JSON.stringify(manualChartData)}.map((s, i) => ({
          label: s.label,
          data: s.data,
          backgroundColor: ['#ff9f40', '#9966ff', '#00c49f', '#ff6384', '#36a2eb'][i % 5]
        }))
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Manual Execution Velocity by Tester', color: '#ffffff' },
          legend: { labels: { color: '#ffffff' } }
        },
        scales: {
          x: { ticks: { color: '#ffffff' }, grid: { color: '#444444' } },
          y: { ticks: { color: '#ffffff' }, grid: { color: '#444444' } }
        }
      }
    });
  </script>
  `;

  for (const sprint of sprintKeys.reverse()) {
    html += `<h2 class="mt-5">📅 Sprint: ${sprint}</h2>`;
    html += `<h4>✅ Merged PR Summary & Review Activity</h4>
    <table class="table table-dark table-bordered table-sm table-striped">
    <thead><tr><th>Author</th><th>Test Scripts</th><th>Workflow Updates</th><th>Script Fixes</th><th>POCs</th><th>Others</th><th>Reviews</th></tr></thead><tbody>`;
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

      html += `<h4 class="mt-3">🧪 Manual Execution Summary</h4>
  <table class="table table-dark table-bordered table-sm table-striped">
  <thead><tr><th>Executed by</th>`;
      for (const d of sortedDates) html += `<th>${d}</th>`;
      html += `<th>Total</th><th>Custom Days</th><th>Velocity</th></tr></thead><tbody>`;

      for (const tester of Object.keys(manualData[sprint]).sort()) {
  const days = manualData[sprint][tester];
  let total = 0;
  html += `<tr><td>${tester}</td>`;
  for (const d of sortedDates) {
    const count = days[d] || 0;
    html += `<td>${count}</td>`;
    total += count;
  }
  const customDays = Object.values(days).filter(x => x > 0).length || 1;
const velocity = (total / customDays).toFixed(1);
html += `<td>${total}</td><td>${customDays}</td><td>${velocity}</td></tr>`;
}
      html += `</tbody></table>`;
    }
  }

  html += `</div></body></html>`;
  return html;
};