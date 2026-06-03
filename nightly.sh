#!/usr/bin/env bash
#
# nightly.sh — runs ONE building session and publishes the result.
# The agent runs inside a container and only edits files. All git + the push
# happen here on the host, where the scoped GitHub token lives.
#
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

LOG_DIR="$REPO_DIR/logs"
mkdir -p "$LOG_DIR"
STAMP="$(date +%Y-%m-%d)"
RUN_LOG="$LOG_DIR/run-$STAMP.json"

echo "[$(date)] Starting nightly build."

# 1. Sync with the remote (harmless if nothing changed).
git pull --quiet || true

# 2. Run the builder inside the isolated container.
#    -v repo:/work        -> the only filesystem it can touch
#    -v ~/.claude         -> reuse the host login (so runs are unattended)
#    The agent edits files only; it has no git access and no exfil tools.
docker run --rm \
  -v "$REPO_DIR":/work \
  -v "$HOME/.claude":/root/.claude \
  -w /work \
  nightly-builder \
  bash -c 'timeout 20m claude -p "$(cat CONSTITUTION.md)" \
      --model opus \
      --max-turns 30 \
      --output-format json \
      --dangerously-skip-permissions \
      --disallowedTools "Bash(curl:*)" "Bash(wget:*)" "Bash(rm -rf:*)"' \
  > "$RUN_LOG" 2>&1 || echo "  builder exited non-zero (see $RUN_LOG)"

# 2b. Keep a served copy of the current rules so the site's About box shows them.
cp CONSTITUTION.md site/constitution.md

# 3. Build-check: the artifact must exist, be non-trivial, and look like a page.
#    If it fails, revert ONLY the artifact and keep the journal entry, so the
#    stumble is logged without breaking the live site.
ART="site/artifact/index.html"
if [[ ! -s "$ART" ]] || ! grep -qi "</html>" "$ART"; then
  echo "  build-check FAILED — reverting artifact, keeping journal."
  git checkout -- site/artifact 2>/dev/null || true
fi

# 4. Publish (host-side push -> Vercel auto-deploys).
if [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -m "Nightly build — $STAMP" --quiet
  git push --quiet
  echo "  pushed nightly build for $STAMP."
else
  echo "  no changes to commit for $STAMP."
fi

echo "[$(date)] Done."
