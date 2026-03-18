#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

pkill -f '/target/debug/app' || true
pkill -f 'vite' || true
pkill -f '@tauri-apps/cli' || true
pkill -f 'cargo run --no-default-features' || true

sleep 1

export PATH="$HOME/.cargo/bin:$PATH"

npx tauri dev
