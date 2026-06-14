#!/usr/bin/env bash

set -euo pipefail

git config user.name "${GIT_AUTHOR_NAME:-github-actions[bot]}"
git config user.email "${GIT_AUTHOR_EMAIL:-41898282+github-actions[bot]@users.noreply.github.com}"

git add docs/workflow.md docs/workflow.html docs/office.html Specs/*/.qm-status.json

if git diff --cached --quiet; then
  echo "No generated artifact changes to commit."
  exit 0
fi

git commit -m "chore(ci): sync generated workflow artifacts [skip ci]"
git push
