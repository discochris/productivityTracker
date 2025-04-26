const axios = require('axios');
const fs = require('fs');
const { config } = require('./config.js');

fs.mkdirSync('./data', { recursive: true }); 

console.log("▶️ Using config start date:", config.startDate);

const headers = {
  Authorization: `token ${config.token}`,
  Accept: 'application/vnd.github.v3+json'
};

async function fetchMergedPRs(repo) {
  const { owner, name } = repo;
  let page = 1;
  let results = [];
  let reviewActivity = {};

  while (true) {
    const url = `https://api.github.com/repos/${owner}/${name}/pulls?state=closed&per_page=100&page=${page}`;

    const res = await axios.get(url, { headers });
    const data = res.data;

    if (data.length === 0) {
      console.log(`🚪 No more PRs found at page ${page}. Exiting loop.`);
      break;
    }

    const matchingPRs = data.filter(pr =>
      pr.merged_at &&
      config.teamMembers.includes(pr.user.login) &&
      new Date(pr.merged_at) >= new Date(config.startDate) &&
      new Date(pr.merged_at) <= new Date(config.endDate)
    );

    for (const pr of matchingPRs) {
      results.push({
        author: pr.user.login,
        title: pr.title,
        url: pr.html_url,
        merged_at: pr.merged_at,
        repo: name
      });

      // 🔍 Fetch Reviews for PR
      try {
        const reviewUrl = `https://api.github.com/repos/${owner}/${name}/pulls/${pr.number}/reviews`;
        const reviewRes = await axios.get(reviewUrl, { headers });

        for (const review of reviewRes.data) {
          const reviewer = review.user.login;

          // Only track reviews for authors in the config file
          if (config.teamMembers.includes(reviewer)) {
            const reviewedAt = new Date(review.submitted_at).toISOString().slice(0, 10);

            if (!reviewActivity[reviewer]) reviewActivity[reviewer] = {};
            if (!reviewActivity[reviewer][reviewedAt]) reviewActivity[reviewer][reviewedAt] = 0;
            reviewActivity[reviewer][reviewedAt]++;
          }
        }
      } catch (err) {
        console.error(`⚠️ Failed to fetch reviews for PR #${pr.number}:`, err.message);
      }
    }

    const lastPR = data[data.length - 1];
    if (lastPR && new Date(lastPR.merged_at || lastPR.closed_at || lastPR.created_at) < new Date(config.startDate)) {
      console.log("🛑 Last PR in this page is older than startDate. Breaking pagination.");
      break;
    }

    if (data.length < 100) {
      console.log("✅ Last page received (less than 100 items).");
      break;
    }

    page++;
  }

  console.log(`📄 Found ${results.length} matching PRs in ${name} so far...`);

  return { results, reviewActivity };
}

async function main() {
  let allPRs = [];
  let allReviews = {};

  for (const repo of config.repos) {
    console.log(`🔍 Fetching PRs from ${repo.owner}/${repo.name}...`);
    try {
      const { results, reviewActivity } = await fetchMergedPRs(repo);
      console.log(`✅ Found ${results.length} merged PRs in ${repo.name}`);
      allPRs.push(...results);

      // Merge review data
      for (const [user, dates] of Object.entries(reviewActivity)) {
        if (!allReviews[user]) allReviews[user] = {};
        for (const [date, count] of Object.entries(dates)) {
          allReviews[user][date] = (allReviews[user][date] || 0) + count;
        }
      }
    } catch (err) {
      console.error(`❌ Error fetching PRs from ${repo.name}:`, err.message || err);
    }
  }

  if (allPRs.length === 0) {
    console.log("⚠️ No PRs found. Check team member names, date range, or repo access.");
  } else {
    fs.writeFileSync('./data/merged_prs.json', JSON.stringify(allPRs, null, 2));
    console.log(`✅ Saved ${allPRs.length} merged PRs to data/merged_prs.json`);
  }

  fs.writeFileSync('./data/review_activity.json', JSON.stringify(allReviews, null, 2));
  console.log(`✅ Saved review activity to data/review_activity.json`);
}

main();
