#!/usr/bin/env bash
# Builds dist/worker.zip for Lambda (Python 3.12, x86_64).
# If you deploy the Lambda on arm64, change the platform to manylinux2014_aarch64.
set -euo pipefail

cd "$(dirname "$0")/.."

rm -rf dist
mkdir -p dist/package

# Download Linux wheels regardless of your local OS so Pillow's binaries match Lambda.
pip install -r requirements.txt \
  --platform manylinux2014_x86_64 \
  --only-binary=:all: \
  --implementation cp \
  --python-version 3.12 \
  --target dist/package

cp src/*.py dist/package/

(cd dist/package && zip -qr ../worker.zip .)
echo "Built dist/worker.zip ($(du -h dist/worker.zip | cut -f1))"