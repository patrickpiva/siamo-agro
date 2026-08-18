#!/usr/bin/env bash
# AgraIA → Siamo rename script — adapted from rename.sh (the AgroLink → AgraIA playbook).
# Plano completo: docs/plano-migracao-siamo.md
#
# Usage (run from repo root, one stage per PR):
#   bash scripts/rename-siamo.sh pr1     # internals: @agraia/* scope, storage keys, SW caches
#   bash scripts/rename-siamo.sh pr2     # user-facing: AgraIA → Siamo, agra.ia.br → siamoagro.com
#   bash scripts/rename-siamo.sh pr3     # docs: md/html/skills, incl. repo/project names
#   bash scripts/rename-siamo.sh verify  # gate: lists remaining brand references (expect empty)
#
# Branch creation, push and PR opening are done manually — see the plan §3 Fase 2.

set -e
# -f: no glob expansion — the CODE_FILES/DOC_FILES patterns (*.ts, *.json…) must
# reach `find` as literal tokens, not be expanded against the repo root.
set -f

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

STAGE="${1:-}"

# Shared find filter: skips deps, build artifacts, git internals, stale worktrees,
# the lockfile, the historical plan doc and the two rename scripts themselves.
run_sed() {
  # $1 = name filters (find expression string), rest = sed -e args
  local names="$1"; shift
  # shellcheck disable=SC2086
  LC_ALL=C find . -type f \( $names \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/.next/*" \
    -not -path "*/dist/*" \
    -not -path "*/.turbo/*" \
    -not -path "*/.claude/worktrees/*" \
    -not -name "pnpm-lock.yaml" \
    -not -name "tsconfig.tsbuildinfo" \
    -not -path "./apps/web/public/sw.js" \
    -not -path "./docs/plano-migracao-siamo.md" \
    -not -name "rename.sh" \
    -not -name "rename-siamo.sh" \
    -exec sed -i '' "$@" {} +
}

CODE_FILES='-name *.ts -o -name *.tsx -o -name *.json -o -name *.mjs -o -name *.css -o -name *.toml -o -name Dockerfile -o -name .env.example'
DOC_FILES='-name *.md -o -name *.html'

case "$STAGE" in

  pr1)
    echo "→ PR 1: internal identifiers (@agraia/* scope, storage keys, SW cache names)…"
    # Order matters: specific → generic. No display-name/domain changes in this stage.
    run_sed "$CODE_FILES" \
      -e 's|@agraia/|@siamo/|g' \
      -e 's|agraia:|siamo:|g' \
      -e 's|agraia-splash|siamo-splash|g' \
      -e 's|agraia-api-|siamo-api-|g' \
      -e 's|agraia-pages|siamo-pages|g'
    # Root package name (plain "agraia", no scope prefix)
    sed -i '' 's|"name": "agraia"|"name": "siamoagro"|' package.json

    echo "→ Rebuilding lockfile…";  pnpm install
    echo "→ Type-checking…";        pnpm typecheck
    echo "→ Testing…";              pnpm test
    echo "→ Building…";             pnpm build

    echo "→ Committing…"
    # -u: only tracked files — never sweep unrelated untracked work into the PR
    git add -u
    git commit -m "chore: renomeia escopo interno @agraia → @siamo (rebrand Siamo, PR 1/3)

- Escopo de pacotes @agraia/* → @siamo/* (package.json ×6, imports, configs, Dockerfile)
- Storage keys e eventos agraia:* → siamo:*
- Cache names do Service Worker e id do splash agraia-* → siamo-*
- Lockfile regenerado

Plano: docs/plano-migracao-siamo.md"
    echo "✓ PR 1 pronto. Rode 'bash scripts/rename-siamo.sh verify' e depois push + PR."
    ;;

  pr2)
    echo "→ PR 2: user-facing brand (AgraIA → Siamo, agra.ia.br → siamoagro.com)…"
    run_sed "$CODE_FILES" \
      -e 's|AgraIA|Siamo|g' \
      -e 's|agra\.ia\.br|siamoagro.com|g' \
      -e 's|agraia\.app|app.siamoagro.com|g' \
      -e 's|@agraia\\/|@siamo\\/|g'   # regex escapado em tsup.config.ts — o sed do PR 1 não pega

    # sed altera conteúdo, nunca nomes de diretório — o rename anterior
    # (AgroLink → AgraIA) caiu nessa mesma armadilha.
    if [ -d "packages/ui/src/icons/agraia" ]; then
      echo "→ Renomeando packages/ui/src/icons/agraia → siamo…"
      git mv packages/ui/src/icons/agraia packages/ui/src/icons/siamo
    fi

    echo "→ Type-checking…";  pnpm typecheck
    echo "→ Testing…";        pnpm test
    echo "→ Building…";       pnpm build

    echo "→ Committing…"
    # -u: only tracked files — never sweep unrelated untracked work into the PR
    git add -u
    git commit -m "feat: rebrand user-facing AgraIA → Siamo (PR 2/3)

- Títulos, manifest PWA, splash, APP_NAME, template WhatsApp de OTP
- Domínio agra.ia.br → siamoagro.com (VAPID_SUBJECT, links)
- Ícones novos entram em commit separado neste PR

Plano: docs/plano-migracao-siamo.md"
    echo "✓ PR 2 pronto. Pendências manuais: ícones novos + trocar TWILIO_CONTENT_SID nas envs."
    ;;

  pr3)
    echo "→ PR 3: docs (CLAUDE.md, README, docs/, skills)…"
    # Docs precisam de TODAS as regras, na mesma ordem, + catch-all para nomes de
    # repo/projeto (agraia → siamoagro) que só aparecem em documentação.
    run_sed "$DOC_FILES" \
      -e 's|@agraia/|@siamo/|g' \
      -e 's|agraia:|siamo:|g' \
      -e 's|AgraIA|Siamo|g' \
      -e 's|agra\.ia\.br|siamoagro.com|g' \
      -e 's|agraia|siamo-agro|g'   # repo/pasta = "siamo-agro"; o domínio (siamoagro.com) já foi tratado acima

    echo "→ Committing…"
    # -u: only tracked files — never sweep unrelated untracked work into the PR
    git add -u
    git commit -m "docs: rebrand AgraIA → Siamo na documentação (PR 3/3)

- CLAUDE.md, README, docs/, .claude/skills
- Nomes de repo/projetos (agraia → siamoagro)

Plano: docs/plano-migracao-siamo.md"
    echo "✓ PR 3 pronto. Rode o verify — deve sobrar apenas rename.sh (histórico) e o plano."
    ;;

  verify)
    echo "→ Verification grep (expect empty)…"
    REMAINING=$(grep -rinE "agraia|agra\.ia\.br" . \
      --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist \
      --exclude-dir=.turbo --exclude-dir=.git --exclude-dir=worktrees \
      --exclude=pnpm-lock.yaml --exclude=tsconfig.tsbuildinfo --exclude=sw.js \
      --exclude=rename.sh --exclude=rename-siamo.sh \
      --exclude=plano-migracao-siamo.md \
      -l 2>/dev/null || true)
    if [ -z "$REMAINING" ]; then
      echo "✓ Zero referências restantes."
    else
      echo "⚠ Referências restantes em:"
      echo "$REMAINING"
    fi
    ;;

  *)
    echo "Usage: bash scripts/rename-siamo.sh <pr1|pr2|pr3|verify>"
    exit 1
    ;;
esac
