#!/usr/bin/env bash
set -euo pipefail;

VERSION_TYPE=${1:-patch}

npm version "$VERSION_TYPE"

git push

NPM_VERSION=$(npm pkg get version | tr -d \")

export GH_PROMPT_DISABLED=true

gh release create "$NPM_VERSION" --title="$NPM_VERSION" --latest
