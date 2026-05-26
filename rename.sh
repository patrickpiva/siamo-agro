#!/usr/bin/env bash
# AgroLink → AgraIA rename script
# Run from the repo root: bash rename.sh

set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

echo "→ Step 1: Verifying branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "chore/rename-agraia" ]; then
  git stash
  git checkout main
  git pull
  git checkout -b chore/rename-agraia
  git stash pop
else
  echo "  Already on chore/rename-agraia, skipping branch creation."
fi

# NOTE: .env.example was pre-edited manually (header comment + VAPID_SUBJECT email domain)
echo "→ Step 2: Running bulk sed replacements..."
LC_ALL=C find . \
  -type f \
  \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.md" -o -name "*.yaml" -o -name "*.yml" -o -name ".env.example" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -name "pnpm-lock.yaml" \
  -exec sed -i '' \
    -e 's|@agrolink/|@agraia/|g' \
    -e 's|agrolink:|agraia:|g' \
    -e 's|AgroLink|AgraIA|g' \
    -e 's|agrolink\.com\.br|agra.ia.br|g' \
    -e 's|agrolink|agraia|g' \
    {} +

# Root package.json name is plain "agrolink" (no @ prefix) — already caught by rule 4 above
# Verify it was replaced:
grep -n '"name"' package.json | head -3

echo "→ Step 2b: Renaming icon directory (sed only changes file contents, not folder names)..."
if [ -d "packages/ui/src/icons/agrolink" ]; then
  mv packages/ui/src/icons/agrolink packages/ui/src/icons/agraia
  echo "  Renamed packages/ui/src/icons/agrolink → agraia"
fi

echo "→ Step 3: Rebuilding lockfile..."
pnpm install

echo "→ Step 4: Type-checking..."
pnpm typecheck

echo "→ Step 5: Building..."
pnpm build

echo "→ Step 6: Verification grep (should return 0 results)..."
# .env.example was pre-edited manually (email domain + header comment)
REMAINING=$(grep -r "agrolink" . \
  --include="*.ts" --include="*.tsx" --include="*.json" \
  --include="*.md" --include="*.yaml" --include="*.env.example" \
  --exclude-dir=node_modules \
  --exclude="pnpm-lock.yaml" \
  --exclude="rename.sh" \
  -l 2>/dev/null)

if [ -z "$REMAINING" ]; then
  echo "✓ Zero agrolink references remaining."
else
  echo "⚠ Remaining references found in:"
  echo "$REMAINING"
fi

echo "→ Step 7: Committing..."
git add -A
git commit -m "$(cat <<'EOF'
chore: rename AgroLink → AgraIA across codebase

- Package scope @agrolink/* → @agraia/*
- Display name AgroLink → AgraIA
- Runtime keys (localStorage, custom events) agraia:*
- Docs, manifest, constants updated

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"

echo ""
echo "✓ Done. Next steps (run after merge):"
echo ""
echo "  A. Open PR: gh pr create --title 'chore: rename AgroLink → AgraIA'"
echo ""
echo "  B. After merge — GitHub repo rename:"
echo "     gh repo rename agraia --yes"
echo "     git remote set-url origin https://github.com/patrickpiva/agraia.git"
echo ""
echo "  C. After merge — local directory rename:"
echo "     cd .. && mv agrolink agraia && cd agraia"
echo ""
echo "  D. After directory rename — migrate Claude Code memory files:"
echo "     mkdir -p ~/.claude/projects/-Users-patrickcoutinho-Documents-GitHub-agraia"
echo "     cp -r ~/.claude/projects/-Users-patrickcoutinho-Documents-GitHub-agrolink/memory \\"
echo "           ~/.claude/projects/-Users-patrickcoutinho-Documents-GitHub-agraia/memory"
echo ""
echo "  E. Supabase dashboard: rename project display name to AgraIA (cosmetic only)"
