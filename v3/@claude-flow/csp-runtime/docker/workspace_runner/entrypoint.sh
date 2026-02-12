#!/usr/bin/env sh
set -eu

if [ -n "${RUNTIME_REQUIREMENTS_FILE:-}" ] && [ -f "${RUNTIME_REQUIREMENTS_FILE}" ]; then
  echo "[csp-runtime] Installing requirements from ${RUNTIME_REQUIREMENTS_FILE}"
  pip install --no-cache-dir -r "${RUNTIME_REQUIREMENTS_FILE}"
fi

mkdir -p /workspace /artifacts

exec "$@"
