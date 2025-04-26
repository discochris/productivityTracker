const axios = require('axios');
const fs = require('fs');
const { config } = require('./config');

if (!config.token) {
  console.error('❌ GitHub Token is missing. Please set GITHUB_TOKEN in your .env file.');
  process.exit(1);
}

fs.mkdirSync('./data', { recursive: true }); 

console.log("▶️ Using config start date:", config.startDate);

const headers = {
  Authorization: `token ${config.token}`,
  Accept: 'application/vnd.github.v3+json'
};

async function fetchClosedPRs(repo) {
  const { owner, name } = repo;
  let page = 1;
  let results = [];
  let reviewActivity = {};

  while (true) {
    const url = `https://api.github.com/repos/${owner}/${name}/pulls?state=closed&per_page=100&page=${page}`;

    const res = await axios.get(url, { headers });
    const data = res.data;

    if (data.length === 0) {
      console.log(`🚪 No more closed PRs found at page ${page}. Exiting loop.`);
      break;
    }

    const matchingPRs = data.filter(pr =>
      config.teamMembers.includes(pr.user.login) &&
      new Date(pr.closed_at || pr.merged_at || pr.created_at) >= new Date(config.startDate) &&
      new Date(pr.closed_at || pr.merged_at || pr.created_at) <= new Date(config.endDate)
    );

    for (const pr of matchingPRs) {
      // Determine if PR was merged or just closed
      const isMerged = pr.merged_at !== null;
      
      results.push({
        author: pr.user.login,
        title: pr.title,
        url: pr.html_url,
        created_at: pr.created_at,
        closed_at: pr.closed_at,
        merged_at: pr.merged_at,
        repo: name,
        status: isMerged ? "Merged" : "Closed",
        is_merged: isMerged
      });

      // Only process PR stats and review activity for merged PRs
      if (isMerged) {
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
    }

    const lastPR = data[data.length - 1];
    if (lastPR && new Date(lastPR.closed_at || lastPR.merged_at || lastPR.created_at) < new Date(config.startDate)) {
      console.log("🛑 Last PR in this page is older than startDate. Breaking pagination.");
      break;
    }

    if (data.length < 100) {
      console.log("✅ Last page received (less than 100 items).");
      break;
    }

    page++;
  }

  const mergedCount = results.filter(pr => pr.is_merged).length;
  const closedCount = results.length - mergedCount;
  
  console.log(`📄 Found ${results.length} closed PRs in ${name} (${mergedCount} merged, ${closedCount} closed without merging)`);

  return { results, reviewActivity };
}

// New function to fetch open PRs
async function fetchOpenPRs(repo) {
  const { owner, name } = repo;
  let page = 1;
  let results = [];

  while (true) {
    const url = `https://api.github.com/repos/${owner}/${name}/pulls?state=open&per_page=100&page=${page}`;

    const res = await axios.get(url, { headers });
    const data = res.data;

    if (data.length === 0) {
      console.log(`🚪 No more open PRs found at page ${page}. Exiting loop.`);
      break;
    }

    const matchingPRs = data.filter(pr =>
      config.teamMembers.includes(pr.user.login) &&
      new Date(pr.created_at) >= new Date(config.startDate)
    );

    for (const pr of matchingPRs) {
      results.push({
        author: pr.user.login,
        title: pr.title,
        url: pr.html_url,
        created_at: pr.created_at,
        closed_at: null,
        merged_at: null, // Open PRs have no merged_at date
        repo: name,
        status: "Open",
        is_merged: false // Mark as not merged
      });
    }

    if (data.length < 100) {
      console.log("✅ Last page of open PRs received (less than 100 items).");
      break;
    }

    page++;
  }

  console.log(`📄 Found ${results.length} open PRs in ${name}`);
  return results;
}

async function main() {
  let allPRs = [];
  let allReviews = {};

  for (const repo of config.repos) {
    console.log(`🔍 Fetching PRs from ${repo.owner}/${repo.name}...`);
    try {
      // Fetch closed PRs (both merged and closed without merging)
      const { results, reviewActivity } = await fetchClosedPRs(repo);
      const mergedCount = results.filter(pr => pr.is_merged).length;
      const closedCount = results.length - mergedCount;
      
      console.log(`✅ Found ${mergedCount} merged PRs and ${closedCount} closed-without-merging PRs in ${repo.name}`);
      allPRs.push(...results);

      // Fetch open PRs
      const openResults = await fetchOpenPRs(repo);
      console.log(`✅ Found ${openResults.length} open PRs in ${repo.name}`);
      allPRs.push(...openResults);

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
    // Save all PRs to merged_prs.json (we'll keep the filename the same for compatibility)
    fs.writeFileSync('./data/merged_prs.json', JSON.stringify(allPRs, null, 2));
    console.log(`✅ Saved ${allPRs.length} PRs to data/merged_prs.json`);
    
    // Stats breakdown
    const mergedCount = allPRs.filter(pr => pr.is_merged).length;
    const closedCount = allPRs.filter(pr => pr.status === "Closed").length;
    const openCount = allPRs.filter(pr => pr.status === "Open").length;
    
    console.log(`📊 PR Status Breakdown: ${mergedCount} Merged, ${closedCount} Closed (not merged), ${openCount} Open`);
  }

  fs.writeFileSync('./data/review_activity.json', JSON.stringify(allReviews, null, 2));
  console.log(`✅ Saved review activity to data/review_activity.json`);
}

main();
