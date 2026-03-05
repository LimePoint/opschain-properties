# CLAUDE.md

## Project Overview

GitHub Actions custom action ("OpsChain Context") that integrates with the OpsChain API to fetch configuration properties and environment variables for use in GitHub workflows. Published as `limepoint/opschain-properties`.

This is the **private** repository. The public version is `opschain-properties`, published via a squash-and-publish release process.

## Architecture

- **Runtime:** Node.js 20 (`node20` GitHub Actions runner)
- **Entry point:** `index.js` (single-file action, no build step)
- **Dependencies:** `@actions/core`, `@actions/github` (checked into `node_modules/`)
- **Action definition:** `action.yml`
- **Release tooling:** `Rakefile` (Ruby/Rake) + `release.sh`

## How It Works

1. Reads inputs: `project`, `environment`, `asset`, `action`, `change_id`, `commit_sha`, `opschain_api_url`, `opschain_api_token`
2. Constructs OpsChain API URLs for context (change) and properties (converged_properties)
3. Fetches change context if `change_id` is provided, outputs as `context`/`context_json`/`context_encoded`
4. Fetches converged properties, extracts config and env variables
5. Strips `GITHUB_`-prefixed env vars for safety
6. Sets GitHub Action outputs: `config`/`config_json`/`config_encoded`, `env`/`env_json`/`env_encoded`
7. Exports env variables to the GitHub workflow and marks `secret-vault://` values as secrets

## Key Files

- `index.js` — All action logic (API calls, output setting, env export)
- `action.yml` — GitHub Action metadata (inputs, branding)
- `package.json` — Dependencies (`@actions/core`, `@actions/github`)
- `Rakefile` — Release automation (tagging, squash-publishing to public repo)
- `release.sh` — Shortcut to run the full release process
- `README.md` — Usage documentation and workflow examples

## Release Process

Releases are tagged as `v1` (rolling tag). The process:

1. Delete remote `v1` tag
2. Delete local `v1` tag
3. `rake private_git_repos:tag_latest` — tags this private repo
4. `rake public_git_repos:publish_squashed_repos` — squash-publishes to `LimePoint/opschain-properties`

The Rakefile requires the `rugged` gem.

## Git Conventions

- Never include AI attribution (Co-Authored-By, etc.) in commit messages
- Always use the user's git identity for commits (do not override git config)
- Keep commit messages concise and descriptive of the change

## Development Notes

- `node_modules/` is committed (required for GitHub Actions to run without a build step)
- No test suite currently (`npm test` is a placeholder)
- Uses native `fetch()` (available in Node 20+) — no HTTP client dependency
- API authentication is Basic auth with the token base64-encoded by the caller
- The action uses `console.log`/`console.debug`/`console.info` alongside `core.info`/`core.warning` for logging
