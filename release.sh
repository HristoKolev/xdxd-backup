#!/usr/bin/env bash
set -euo pipefail;

npm version patch

git push

NPM_VERSION=$(npm pkg get version | tr -d \")

export GH_PROMPT_DISABLED=true

gh release create "$NPM_VERSION" --title="$NPM_VERSION" --latest
