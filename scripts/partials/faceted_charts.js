// partials/faceted_charts.js
module.exports = function generateFacetedChartsHTML({ sprintMap, reviewData, manualData, getSprintStart }) {
  const authors = [...new Set(Object.values(sprintMap).flatMap(obj => Object.keys(obj)))];
  const sprints = Object.keys(sprintMap).sort();
  const manualTesters = [...new Set(Object.values(manualData).flatMap(Object.keys))];
  const colors = ['#36a2eb', '#ff6384', '#4bc0c0', '#9966ff', '#ff9f40', '#00c49f'];

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Faceted Charts</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { background-color: #121212; color: white; font-family: 'Segoe UI', Roboto, sans-serif; }
    h1, h2, h4 { color: #ffffff; }
    .chart-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 30px;
      margin-bottom: 60px;
    }
    canvas { background-color: #1e1e1e; padding: 10px; border-radius: 10px; }
    a.btn { margin-top: 20px; margin-right: 10px; }
  </style></head><body class="p-4">
  <div class="container">
    <a href="sprint_comparison.html" class="btn btn-outline-light mb-4">← Back to Sprint Comparison</a>
    <h1 class="mb-4">📊 Faceted PR Activity Charts</h1>
    <div class="chart-grid">`;

  // PR Charts per Author
  authors.forEach(author => {
    const datasets = ['Test Script', 'Workflow Update', 'Script Fix', 'POC', 'Others', 'Reviews'].map((type, i) => {
      return {
        label: type,
        data: sprints.map(sprint => {
          const counts = sprintMap[sprint]?.[author] || {};
          if (type === 'Reviews') {
            return Object.entries(reviewData[author] || {}).reduce((sum, [date, count]) => {
              const { start, end } = getSprintStart(date);
              return sprint === `${start} to ${end}` ? sum + count : sum;
            }, 0);
          }
          return counts[type] || 0;
        }),
        backgroundColor: colors[i % colors.length]
      };
    });

    const id = `chart-pr-${author.replace(/\W/g, '')}`;
    html += `<div><h5 class="text-center">${author}</h5><canvas id="${id}" height="300"></canvas></div>
    <script>
    new Chart(document.getElementById('${id}').getContext('2d'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(sprints)},
        datasets: ${JSON.stringify(datasets)}
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'PR Types + Reviews for ${author}',
            color: '#fff'
          },
          legend: { labels: { color: '#ffffff' } }
        },
        scales: {
          x: { ticks: { color: '#ffffff', maxRotation: 45, minRotation: 20 }, grid: { color: '#444444' } },
          y: { ticks: { color: '#ffffff' }, grid: { color: '#444444' } }
        }
      }
    });
    </script>`;
  });

  html += `</div><h2 class="mb-4">🧪 Manual Execution Charts</h2><div class="chart-grid">`;

  // Manual Execution Charts per Tester
  manualTesters.forEach(tester => {
    const executedDataset = sprints.map(sprint => {
  const records = manualData[sprint]?.[tester] || {};
  return Object.values(records).reduce((a, b) => a + b, 0);
});

    const id = `chart-manual-${tester.replace(/\W/g, '')}`;
    html += `<div><h5 class="text-center">${tester}</h5><canvas id="${id}" height="300"></canvas></div>
    <script>
    new Chart(document.getElementById('${id}').getContext('2d'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(sprints)},
        datasets: [
          {
            label: 'Test Cases Executed',
            data: ${JSON.stringify(executedDataset)},
            backgroundColor: '#36a2eb'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Manual Execution for ${tester}',
            color: '#fff'
          },
          legend: { labels: { color: '#ffffff' } }
        },
        scales: {
          x: { ticks: { color: '#ffffff' }, grid: { color: '#444444' } },
          y: {
            ticks: { color: '#ffffff' },
            grid: { color: '#444444' },
            suggestedMax: 50
          }
        }
      }
    });
    </script>`;
  });

  html += `</div></div></body></html>`;
  return html;
};