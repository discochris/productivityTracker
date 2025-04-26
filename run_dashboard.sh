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

# Start local server in background (for PDF export via fetch)
echo "🛰️  Starting local server..."
python3 -m http.server --directory public 8000 > /dev/null 2>&1 &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Open dashboard in browser
echo "🌐 Opening dashboard..."
open "http://localhost:8000/dashboard.html"

echo "✅ All done! Dashboard ready in browser."

# Optional: Kill server after some time (optional safeguard)
sleep 10
kill "$SERVER_PID" > /dev/null 2>&1

# Close Terminal window
osascript -e 'tell application "Terminal" to close front window' & exit