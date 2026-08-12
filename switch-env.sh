#!/usr/bin/env bash
# Switch the Go backend AND the Next.js frontend to staging or production TOGETHER.
#
# They MUST switch together: better-auth (frontend) and the Go backend share the
# same MySQL `session` table. If they ever disagree, login succeeds but every API
# call returns 401. This script writes both sides from the same env name so that
# cannot happen.
#
#   ./switch-env.sh stg     # backend + frontend -> trexo_stg
#   ./switch-env.sh prod    # backend + frontend -> trexo
#   ./switch-env.sh         # show usage + the active DB on each side
#
# Then start both apps (after `docker compose down` in backend/ to free 3306/8081):
#   (cd backend  && go run ./cmd/server)   &
#   (cd frontend && yarn dev)
set -euo pipefail
cd "$(dirname "$0")"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

# DB name from a backend DSN line:        DSN=.../trexo_stg?parseTime -> trexo_stg
be_db() { grep -E '^DSN=' "$1" 2>/dev/null | sed -E 's#.*/([A-Za-z0-9_]+)[?].*#\1#' || echo "?"; }
# DB name from a frontend DATABASE_URL:   DATABASE_URL=mysql://.../trexo_stg -> trexo_stg
fe_db() { grep -E '^DATABASE_URL=' "$1" 2>/dev/null | sed -E 's#.*/([A-Za-z0-9_]+)$#\1#' || echo "?"; }

# resolve <env> <dir> -> echo the real file dir/.env.<env>, else its .example.
resolve() {
	local env="$1" dir="$2" f
	for f in "${dir}/.env.${env}" "${dir}/.env.${env}.example"; do
		[[ -f "$f" ]] && { echo "$f"; return 0; }
	done
	return 1
}

case "${1:-}" in
	stg|staging)     env_name="staging" ;;
	prod|production) env_name="production" ;;
	*)
		echo -e "${YELLOW}Usage: ./switch-env.sh [stg|prod]${NC}"
		echo "  stg   - staging (trexo_stg)      prod - production (trexo)"
		echo ""
		echo -e "backend : ${GREEN}$(be_db backend/.env.local)${NC}"
		echo -e "frontend: ${GREEN}$(fe_db frontend/.env.local)${NC}"
		exit 0
		;;
esac

errors=0

# --- backend ---
if src=$(resolve "$env_name" "backend"); then
	cp "$src" backend/.env.local
	case "$src" in *.example)
		echo -e "${RED}NOTE:${NC} backend/$src is a placeholder — set the real DSN in backend/.env.local" ;;
	esac
	echo -e "backend : ${GREEN}✓ $(be_db backend/.env.local)${NC}"
else
	echo -e "${RED}ERROR:${NC} backend/.env.${env_name}(.example) not found" >&2
	errors=1
fi

# --- frontend ---
if src=$(resolve "$env_name" "frontend"); then
	cp "$src" frontend/.env.local
	case "$src" in *.example)
		echo -e "${RED}NOTE:${NC} frontend/$src is a placeholder — set the real DATABASE_URL in frontend/.env.local" ;;
	esac
	echo -e "frontend: ${GREEN}✓ $(fe_db frontend/.env.local)${NC}"
else
	echo -e "${RED}ERROR:${NC} frontend/.env.${env_name}(.example) not found" >&2
	errors=1
fi

if [[ $errors -ne 0 ]]; then
	echo -e "${RED}✗ Switch incomplete — fix the errors above.${NC}" >&2
	exit 1
fi

echo ""
echo -e "${GREEN}✓ Switched BOTH sides to ${env_name^^}${NC}"
echo "  backend :  cd backend && go run ./cmd/server"
echo "  frontend:  cd frontend && yarn dev"
