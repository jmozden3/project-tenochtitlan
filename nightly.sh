#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

LOG_DIR="$REPO_DIR/logs"
mkdir -p "$LOG_DIR"
STAMP="$(date +%Y-%m-%d)"
RUN_LOG="$LOG_DIR/run-$STAMP.json"

echo "[$(date)] Starting nightly build."
git pull --quiet || true

docker run --rm \
  -v "$REPO_DIR":/work \
  -v "$HOME/.claude":/root/.claude \
  -v "$HOME/.claude.json":/root/.claude.json \
  -e IS_SANDBOX=1 \
  -w /work \
  nightly-builder \
  bash -c 'timeout 20m claude -p "$(cat CONSTITUTION.md)" \
      --model opus \
      --max-turns 30 \
      --output-format json \
      --dangerously-skip-permissions \
      --disallowedTools "Bash(curl:*)" "Bash(wget:*)" "Bash(rm -rf:*)"' \
  > "$RUN_LOG" 2>&1 || echo "  builder exited non-zero (see $RUN_LOG)"

cp CONSTITUTION.md site/constitution.md

ART="site/artifact/index.html"
if [[ ! -s "$ART" ]] || ! grep -qi "</html>" "$ART"; then
  echo "  build-check FAILED — reverting artifact, keeping journal."
  git checkout -- site/artifact 2>/dev/null || true
fi

if [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -m "Nightly build — $STAMP" --quiet
  git push --quiet
  echo "  pushed nightly build for $STAMP."
else
  echo "  no changes to commit for $STAMP."
fi

echo "[$(date)] Done."
