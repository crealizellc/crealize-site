#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load env
source "$SCRIPT_DIR/load-env.sh"

OWNER="$GH_OWNER"
REPO="$GH_REPO"
BRANCH="$GH_PAGES_BRANCH"
PATH_PREFIX="$GH_PAGES_PATH"
DOMAIN="$GH_PAGES_DOMAIN"
WORKDIR="$REPO_ROOT/.tmp-crealize-pages"

rm -rf "$WORKDIR" && mkdir -p "$WORKDIR"

# Check if Pages is enabled; if not, create, else update
set +e
pages_json=$(gh api "repos/$OWNER/$REPO/pages" 2>/dev/null)
rc=$?
set -e
if [ $rc -ne 0 ]; then
  echo "Enabling Pages for $OWNER/$REPO -> $BRANCH:$PATH_PREFIX with CNAME=$DOMAIN"
  gh api -X POST "repos/$OWNER/$REPO/pages" \
    -f "source[branch]=$BRANCH" -f "source[path]=$PATH_PREFIX" -f cname="$DOMAIN" >/dev/null || true
else
  echo "Updating Pages source to $BRANCH:$PATH_PREFIX and CNAME=$DOMAIN"
  gh api -X PUT "repos/$OWNER/$REPO/pages" \
    -f "source[branch]=$BRANCH" -f "source[path]=$PATH_PREFIX" -f cname="$DOMAIN" >/dev/null || true
fi

# Prepare gh-pages branch and ensure CNAME
if [ -d "$WORKDIR/.git" ]; then rm -rf "$WORKDIR"; mkdir -p "$WORKDIR"; fi
GIT_ASKPASS=/bin/true git clone --depth 1 "https://github.com/$OWNER/$REPO.git" "$WORKDIR"
cd "$WORKDIR"
if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
else
  git checkout --orphan "$BRANCH"
  rm -rf ./*
fi
printf "%s\n" "$DOMAIN" > CNAME

git add CNAME
if ! git diff --cached --quiet; then
  git -c user.email="actions@users.noreply.github.com" -c user.name="automation" commit -m "chore: ensure CNAME for custom domain"
  CHANGED=1
else
  CHANGED=0
fi

git push -u "https://$GH_TOKEN@github.com/$OWNER/$REPO.git" "$BRANCH"

# Trigger build
set +e
resp=$(gh api -X POST "repos/$OWNER/$REPO/pages/builds" 2>/dev/null)
set -e
[ -n "${resp:-}" ] && echo "Triggered build"

# Poll build status
for i in {1..60}; do
  status=$(gh api "repos/$OWNER/$REPO/pages/builds/latest" -q ".status" 2>/dev/null || echo "unknown")
  echo "Build status: $status"
  if [ "$status" = "built" ]; then break; fi
  if [ "$status" = "errored" ]; then echo "Pages build errored" >&2; exit 1; fi
  sleep 5
done

# Show final settings
echo "Final Pages settings:"
gh api "repos/$OWNER/$REPO/pages" | sed 's/\"GH_TOKEN\"/"***"/g' | cat
