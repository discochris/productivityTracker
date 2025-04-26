#!/bin/bash

cd ~/Documents/GitHub/pr_dashboard_full || exit 1

echo "🚀 Starting dashboard generation..."
echo ""

# Spinner function
spin() {
  local -a marks=('-' '\' '|' '/')
  while :; do
    for m in "${marks[@]}"; do
      printf "\r🔄 Fetching PRs... %s" "$m"
      sleep 0.1
    done
  done
}

# Start spinner in background
spin &
SPIN_PID=$!

# Run fetch script
node scripts/fetch_prs.js > /dev/null 2>&1

# Kill spinner
kill "$SPIN_PID" >/dev/null 2>&1
wait "$SPIN_PID" 2>/dev/null

printf "\r✅ PR fetch complete!           \n"

printf "\r📝 Preparing Manual productivity report...\n"
node scripts/parse_manual_test_report.js

# Generate dashboard
echo "🧠 Generating dashboard..."
node scripts/generate_dashboard.js

# Open dashboard directly in browser
echo "🌐 Opening dashboard..."
open "file://$(pwd)/public/dashboard.html"

echo "✅ All done! Dashboard ready in browser."

# Close Terminal window after a short delay
sleep 1
osascript -e 'tell application "Terminal" to close front window' & exit