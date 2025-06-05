#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"  # ensure we run from repo root
npm ci --legacy-peer-deps
