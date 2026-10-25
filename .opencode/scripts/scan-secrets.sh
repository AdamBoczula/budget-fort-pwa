#!/bin/bash
# Secrets Scanner for Budget Fort
# Scans modified files for accidentally leaked secrets, credentials, and sensitive data.
#
# Environment variables:
#   SCAN_MODE          - "warn" (log only) or "block" (exit non-zero) (default: warn)
#   SCAN_SCOPE         - "diff" (changed files) or "staged" (staged files) (default: diff)
#   SKIP_SECRETS_SCAN  - "true" to disable scanning entirely
#   SECRETS_LOG_DIR    - Directory for scan logs (default: logs/secrets)
#   SECRETS_ALLOWLIST  - Comma-separated patterns to ignore

set -euo pipefail

# ---------------------------------------------------------------------------
# Secret detection patterns
# ---------------------------------------------------------------------------
PATTERNS=(
  "AWS_ACCESS_KEY|critical|AKIA[0-9A-Z]{16}"
  "AWS_SECRET_KEY|critical|aws_secret_access_key[[:space:]]*[:=][[:space:]]*['\"]?[A-Za-z0-9/+=]{40}"
  "GCP_SERVICE_ACCOUNT|critical|\"type\"[[:space:]]*:[[:space:]]*\"service_account\""
  "GCP_API_KEY|high|AIza[0-9A-Za-z_-]{35}"
  "AZURE_CLIENT_SECRET|critical|azure[_-]?client[_-]?secret[[:space:]]*[:=][[:space:]]*['\"]?[A-Za-z0-9_~.-]{34,}"
  "GITHUB_PAT|critical|ghp_[0-9A-Za-z]{36}"
  "GITHUB_FINE_GRAINED_PAT|critical|github_pat_[0-9A-Za-z_]{82}"
  "PRIVATE_KEY|critical|-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----"
  "PGP_PRIVATE_BLOCK|critical|-----BEGIN PGP PRIVATE KEY BLOCK-----"
  "GENERIC_SECRET|high|(secret|token|password|passwd|pwd|api[_-]?key|apikey|access[_-]?key|auth[_-]?token|client[_-]?secret)[[:space:]]*[:=][[:space:]]*['\"]?[A-Za-z0-9_/+=~.-]{8,}"
  "CONNECTION_STRING|high|(mongodb(\\+srv)?|postgres(ql)?|mysql|redis|amqp|mssql)://[^[:space:]'\"]{10,}"
  "BEARER_TOKEN|medium|[Bb]earer[[:space:]]+[A-Za-z0-9_-]{20,}\\.[A-Za-z0-9_-]{20,}"
  "SLACK_TOKEN|high|xox[baprs]-[0-9]{10,}-[0-9A-Za-z-]+"
  "SLACK_WEBHOOK|high|https://hooks\\.slack\\.com/services/T[0-9A-Z]{8,}/B[0-9A-Z]{8,}/[0-9A-Za-z]{24}"
  "DISCORD_TOKEN|high|[MN][A-Za-z0-9]{23,}\\.[A-Za-z0-9_-]{6}\\.[A-Za-z0-9_-]{27,}"
  "TWILIO_API_KEY|high|SK[0-9a-fA-F]{32}"
  "SENDGRID_API_KEY|high|SG\\.[0-9A-Za-z_-]{22}\\.[0-9A-Za-z_-]{43}"
  "STRIPE_SECRET_KEY|critical|sk_live_[0-9A-Za-z]{24,}"
  "STRIPE_RESTRICTED_KEY|high|rk_live_[0-9A-Za-z]{24,}"
  "NPM_TOKEN|high|npm_[0-9A-Za-z]{36}"
  "JWT_TOKEN|medium|eyJ[A-Za-z0-9_-]{10,}\\.eyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}"
  "INTERNAL_IP_PORT|medium|(^|[^.0-9])(10\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}|172\\.(1[6-9]|2[0-9]|3[01])\\.[0-9]{1,3}\\.[0-9]{1,3}|192\\.168\\.[0-9]{1,3}\\.[0-9]{1,3}):[0-9]{2,5}([^0-9]|$)"
)

if [[ "${SKIP_SECRETS_SCAN:-}" == "true" ]]; then
  echo "⏭️  Secrets scan skipped (SKIP_SECRETS_SCAN=true)"
  exit 0
fi

if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  echo "⚠️  Not in a git repository, skipping secrets scan"
  exit 0
fi

MODE="${SCAN_MODE:-warn}"
SCOPE="${SCAN_SCOPE:-diff}"
LOG_DIR="${SECRETS_LOG_DIR:-logs/secrets}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
FINDING_COUNT=0

mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/scan.log"

# Collect files
FILES=()
if [[ "$SCOPE" == "staged" ]]; then
  while IFS= read -r f; do
    [[ -n "$f" ]] && FILES+=("$f")
  done < <(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null)
else
  while IFS= read -r f; do
    [[ -n "$f" ]] && FILES+=("$f")
  done < <(git diff --name-only --diff-filter=ACMR HEAD 2>/dev/null || git diff --name-only --diff-filter=ACMR 2>/dev/null)
  while IFS= read -r f; do
    [[ -n "$f" ]] && FILES+=("$f")
  done < <(git ls-files --others --exclude-standard 2>/dev/null)
fi

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "✨ No modified files to scan"
  exit 0
fi

# Allowlist
ALLOWLIST=()
if [[ -n "${SECRETS_ALLOWLIST:-}" ]]; then
  IFS=',' read -ra ALLOWLIST <<< "$SECRETS_ALLOWLIST"
fi

is_allowlisted() {
  local match="$1"
  for pattern in "${ALLOWLIST[@]}"; do
    pattern=$(printf '%s' "$pattern" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    [[ -z "$pattern" ]] && continue
    if [[ "$match" == *"$pattern"* ]]; then
      return 0
    fi
  done
  return 1
}

is_text_file() {
  local filepath="$1"
  [[ -f "$filepath" ]] && file --brief --mime-type "$filepath" 2>/dev/null | grep -q "^text/" && return 0
  case "$filepath" in
    *.md|*.txt|*.json|*.yaml|*.yml|*.xml|*.toml|*.ini|*.cfg|*.conf|\
    *.sh|*.bash|*.zsh|*.ps1|*.bat|*.cmd|\
    *.py|*.rb|*.js|*.ts|*.jsx|*.tsx|*.go|*.rs|*.java|*.kt|*.cs|*.cpp|*.c|*.h|\
    *.php|*.swift|*.scala|*.r|*.R|*.lua|*.pl|*.ex|*.exs|*.hs|*.ml|\
    *.html|*.css|*.scss|*.less|*.svg|\
    *.sql|*.graphql|*.proto|\
    *.env|*.env.*|*.properties|\
    Dockerfile*|Makefile*|Vagrantfile|Gemfile|Rakefile)
      return 0 ;;
    *)
      return 1 ;;
  esac
}

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

FINDINGS=()

scan_file() {
  local filepath="$1"
  local read_path="${2:-$1}"
  [[ -f "$read_path" ]] || return 0
  if ! is_text_file "$filepath"; then return 0; fi
  case "$filepath" in
    *.lock|package-lock.json|yarn.lock|pnpm-lock.yaml|Cargo.lock|go.sum|*.sum) return 0 ;;
  esac

  for entry in "${PATTERNS[@]}"; do
    IFS='|' read -r pattern_name severity regex <<< "$entry"
    while IFS=: read -r line_num matched_line; do
      local match
      match=$(printf '%s\n' "$matched_line" | grep -oE "$regex" 2>/dev/null | head -1)
      [[ -z "$match" ]] && continue

      if [[ "$pattern_name" == "INTERNAL_IP_PORT" ]]; then
        match=$(printf '%s' "$match" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:[0-9]+')
        [[ -z "$match" ]] && continue
      fi

      if [[ ${#ALLOWLIST[@]} -gt 0 ]] && is_allowlisted "$match"; then continue; fi
      if printf '%s\n' "$match" | grep -qiE '(example|placeholder|your[_-]|xxx|changeme|TODO|FIXME|replace[_-]?me|dummy|fake|test[_-]?key|sample)'; then continue; fi

      local redacted
      if [[ ${#match} -le 12 ]]; then redacted="[REDACTED]"; else redacted="${match:0:4}...${match: -4}"; fi

      FINDINGS+=("$filepath	$line_num	$pattern_name	$severity	$redacted")
      FINDING_COUNT=$((FINDING_COUNT + 1))
    done < <(grep -nE "$regex" "$read_path" 2>/dev/null || true)
  done
}

echo "🔍 Scanning ${#FILES[@]} modified file(s) for secrets..."

for filepath in "${FILES[@]}"; do
  if [[ "$SCOPE" == "staged" ]]; then
    _tmpfile=$(mktemp)
    git show :"$filepath" > "$_tmpfile" 2>/dev/null || true
    scan_file "$filepath" "$_tmpfile"
    rm -f "$_tmpfile"
  else
    scan_file "$filepath"
  fi
done

if [[ $FINDING_COUNT -gt 0 ]]; then
  echo ""
  echo "⚠️  Found $FINDING_COUNT potential secret(s) in modified files:"
  echo ""
  printf "  %-40s %-6s %-28s %s\n" "FILE" "LINE" "PATTERN" "SEVERITY"
  printf "  %-40s %-6s %-28s %s\n" "----" "----" "-------" "--------"

  for finding in "${FINDINGS[@]}"; do
    IFS=$'\t' read -r fpath fline pname psev redacted <<< "$finding"
    printf "  %-40s %-6s %-28s %s\n" "$fpath" "$fline" "$pname" "$psev"
  done
  echo ""

  if [[ "$MODE" == "block" ]]; then
    echo "🚫 Session blocked: resolve the findings above before committing."
    exit 1
  else
    echo "💡 Review findings above. Set SCAN_MODE=block to prevent commits with secrets."
  fi
else
  echo "✅ No secrets detected in ${#FILES[@]} scanned file(s)"
fi

exit 0