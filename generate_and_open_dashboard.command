#!/bin/bash

cd "$(dirname "$0")"

echo "📥 Fetching PRs..."
node scripts/fetch_prs.js || {
  osascript -e 'display notification "Failed to fetch PRs" with title "PR Dashboard"'
  exit 1
}

echo "🧾 Generating dashboard..."
node scripts/generate_dashboard.js || {
  osascript -e 'display notification "Failed to generate dashboard" with title "PR Dashboard"'
  exit 1
}

echo "🌐 Opening dashboard..."
open public/dashboard.html

osascript -e 'display notification "Dashboard generated and opened!" with title "PR Dashboard"'
