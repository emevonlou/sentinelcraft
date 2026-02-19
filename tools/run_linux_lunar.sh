#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORTS_DIR="$ROOT_DIR/reports"
STAMP="$(date +"%Y-%m-%d_%H%M%S")"

mkdir -p "$REPORTS_DIR"

echo "[+] Running Linux Lunar/Hypixel baseline..."
OUT="$("$ROOT_DIR/scripts/linux/lunar_hypixel_baseline.sh")"

FILE="$REPORTS_DIR/report_linux_lunar_${STAMP}.txt"
printf "%s\n" "$OUT" > "$FILE"

echo "[+] Saved: $FILE"
