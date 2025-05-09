// partials/dashboard.js
//<a href="#" onclick="exportAllPagesAsPDF()" class="btn btn-success">📄 Export All Pages as PDF</a>


module.exports = function generateDashboardHTML({ totalPRMap, totalManualMap, manualData, data, mergedPRs, classifyPR, readableStartDate, config }) {
  let html = `
  <!DOCTYPE html><html><head>
  <meta charset="UTF-8">
  <title>PR Dashboard</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <style>
    body { background-color: #121212; color: white; font-family: 'Segoe UI', Roboto, sans-serif; }
    h1, h2, h4, h6 { color: #ffffff; }
    .table, .table-striped tbody tr:nth-of-type(odd) { background-color: #1e1e1e; }
    .table thead th { background-color: #333; color: #fff; }
    .table td, .table th { border-color: #444; }
    a.btn { margin-top: 20px; margin-right: 10px; }
    .status-closed { color: #6dff6d !important; font-weight: bold; }
    .status-merged { color: #6db9ff !important; font-weight: bold; }
    .status-open { color: rgb(198, 122, 40) !important; font-weight: bold; }
  </style></head>
  <body class="p-4">
  <div class="container">
    <h1 class="mb-4">📊 Adtech - Productivty Dashboard</h1>
    <h6>📅 Data from: ${readableStartDate}</h6>

    <a href="sprint_comparison.html" class="btn btn-primary">View Sprint-over-Sprint Comparison →</a>
    
    <h2 class="mt-5">📉 Total Closed PR Summary</h2>
    <table class="table table-dark table-bordered table-striped table-sm">
      <thead><tr><th>Author</th><th>Test Scripts</th><th>Workflow Updates</th><th>Script Fixes</th><th>POCs</th><th>Others</th><th>Reviews</th></tr></thead>
      <tbody>`;

  for (const author of Object.keys(totalPRMap).sort()) {
    const c = totalPRMap[author];
    html += `<tr><td>${author}</td><td>${c['Test Script']}</td><td>${c['Workflow Update']}</td><td>${c['Script Fix']}</td><td>${c['POC'] || 0}</td><td>${c['Others']}</td><td>${c['Reviews']}</td></tr>`;
  }

  html += `</tbody></table>

    <h2 class="mt-5">📈 Manual Execution Summary</h2>
    <table class="table table-dark table-bordered table-striped table-sm">
      <thead><tr><th>Executed By</th><th>Total</th><th>Active Days</th><th>Velocity</th></tr></thead>
      <tbody>`;

  for (const tester of Object.keys(totalManualMap).sort()) {
    let activeDays = 0;
    for (const sprint of Object.keys(manualData)) {
      const records = manualData[sprint]?.[tester];
      if (records) {
        for (const [dateStr, count] of Object.entries(records)) {
          const date = new Date(dateStr);
          if (date >= new Date(config.startDate) && date <= new Date(config.endDate) && count > 0) {
            activeDays++;
          }
        }
      }
    }

    const total = totalManualMap[tester];
    const velocity = activeDays ? (total / activeDays).toFixed(1) : '0.0';
    html += `<tr><td>${tester}</td><td>${total}</td><td>${activeDays}</td><td>${velocity}</td></tr>`;
  }

  html += `</tbody></table>

    <h2 class="mt-5">📋 Detailed Pull Requests</h2>
    <table class="table table-dark table-hover table-sm">
      <thead class="table-primary"><tr><th>Date</th><th>Author</th><th>Type</th><th>Status</th><th>Title</th><th>Repo</th></tr></thead>
      <tbody>`;

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
      <td><a href="${pr.url}" target="_blank">${pr.title}</a></td>
      <td>${pr.repo}</td>
    </tr>`;
  }

  html += `</tbody></table>
  </div>

  <script>
    async function exportAllPagesAsPDF() {
      const pages = ['dashboard.html', 'sprint_comparison.html', 'faceted_charts.html'];
      const mergedContainer = document.createElement('div');

      for (const page of pages) {
        const response = await fetch(page);
        const text = await response.text();
        const temp = document.createElement('div');
        temp.innerHTML = text;

        const container = temp.querySelector('.container');
        if (container) {
          const section = document.createElement('div');
          section.innerHTML = '<h2 style="margin-top:30px; font-size:20px;">' + page.replace('.html', '').replace(/_/g, ' ').toUpperCase() + '</h2>';
          section.appendChild(container.cloneNode(true));
          mergedContainer.appendChild(section);
        }
      }

      html2pdf().from(mergedContainer).set({
        margin: 0.5,
        filename: 'Adtech_PR_Dashboard.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      }).save();
    }
  </script>
  </body></html>`;

  return html;
};
