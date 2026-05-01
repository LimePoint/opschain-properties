#!/bin/bash
set -euo pipefail

VERSION="${VERSION:-v2}"

# Build the bundled action before tagging so dist/index.js is current.
npm install
npm run build

# Re-tag and publish.
git push --delete origin "$VERSION" || true
git tag -d "$VERSION" || true
rake private_git_repos:tag_latest
rake public_git_repos:publish_squashed_repos
