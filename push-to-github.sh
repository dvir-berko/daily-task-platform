#!/bin/bash
# Run this script from inside the daily-task-platform folder
# to create the GitHub repo and push everything.
#
# Prerequisites:
#   gh auth login   (GitHub CLI, https://cli.github.com)
#   OR set GITHUB_TOKEN env variable and use git remote

set -e

REPO="daily-task-platform"
DESCRIPTION="Daily task platform with WhatsApp reminders — React + Node.js"

echo "🚀 Initialising git..."
git init
git add .
git commit -m "feat: initial commit — daily task platform with WhatsApp"

echo "📦 Creating GitHub repo..."
if command -v gh &> /dev/null; then
  gh repo create "$REPO" --public --description "$DESCRIPTION" --source=. --remote=origin --push
  echo "✅ Done! Repo: https://github.com/$(gh api user --jq .login)/$REPO"
else
  echo "GitHub CLI not found. Create the repo manually at https://github.com/new"
  echo "Then run:"
  echo "  git remote add origin https://github.com/dvirbf18/$REPO.git"
  echo "  git branch -M main"
  echo "  git push -u origin main"
fi
