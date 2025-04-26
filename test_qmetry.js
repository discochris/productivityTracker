const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Replace with your actual values
const projectId = '10081'; // Your QMetry Project ID
const apiKey = '22e4c70001715ab19ec36a310e3e62060975e93dae2bd4580b1f0fc17e1488a8e082f68c8106463b3ed1bc5056e031ab14026ebf512fdc5971a5ef4ce8d23c90b9bcf9f51867d63d52652760e04d1a1c'; // Your QMetry API Key

const url = `https://qtm4j.qmetry.com/rest/api/latest/execution/summary?projectId=${projectId}`;

const headers = {
  'apiKey': apiKey
};

axios.get(url, { headers })
  .then((response) => {
    const outputDir = path.join(__dirname, 'data');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const filePath = path.join(outputDir, 'qmetry_summary.json');
    fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2));
    console.log('✅ QMetry summary saved to data/qmetry_summary.json');
  })
  .catch((error) => {
    console.error('❌ API Error:', error.message || error);
  });
