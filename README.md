# OpsChain Properties Action

This action downloads converged configuration properties from OpsChain so they can be referenced and used within GitHub Actions jobs and steps.

> **v2:** rebuilt on the official [`@opschain/api-client`](https://github.com/limepoint/opschain-api-client-typescript-sdk) TypeScript SDK. Authentication is now driven by environment variables (no longer action inputs), and the output surface is simplified. See **[Migrating from v1](#migrating-from-v1)** below.

## Inputs

| Input        | Required | Description                                                  |
|--------------|----------|--------------------------------------------------------------|
| `project`    | yes      | OpsChain project code                                        |
| `asset`      | yes      | OpsChain asset code                                          |
| `environment`| no       | OpsChain environment code (informational; not used in URL)   |
| `change_id`  | no       | OpsChain change ID; if omitted, the `context` output is `""` |
| `commit_sha` | no       | Git commit SHA (informational)                               |

## Authentication (environment variables)

Set the following on the workflow, job, or step `env:` block. They are typically populated from organization-level GitHub Secrets.

| Env var                     | Required | Default        | Notes                                              |
|-----------------------------|----------|----------------|----------------------------------------------------|
| `OPSCHAIN_API_URL`          | yes      | —              | Base URL of the OpsChain instance                  |
| `OPSCHAIN_USERNAME`         | yes      | —              | OpsChain username                                  |
| `OPSCHAIN_PASSWORD`         | yes      | —              | OpsChain password                                  |
| `OPSCHAIN_API_AUTH_SCHEME`  | no       | `bearerAuth`   | One of `bearerAuth`, `basicAuth`, `cookieAuth`     |

`bearerAuth` (default) exchanges username/password for a JWT via `POST /api/tokens/access_token` and auto-refreshes on 401. `basicAuth` sends `Authorization: Basic ...` on every request. `cookieAuth` exchanges credentials once and replays the resulting `Set-Cookie` value as a `Cookie` header on subsequent requests; **note that cookieAuth does not auto-refresh on 401**, so a cookie that expires mid-run will surface as `Unauthorized`.

## Outputs

| Output    | Value                                                                     |
|-----------|---------------------------------------------------------------------------|
| `context` | JSON-stringified change object, or `""` when `change_id` is omitted       |
| `config`  | JSON-stringified converged config (with the `opschain` key removed)       |
| `env`     | JSON-stringified env map (with `GITHUB_*` keys removed)                   |

In addition to setting these outputs, the action exports each `env` entry as a GitHub workflow environment variable via `core.exportVariable`, so subsequent steps can reference them as `${{ env.MY_VAR }}`. Values starting with `secret-vault://` are masked in logs via `core.setSecret`.

> **Important:** when consuming JSON outputs in shell `run` steps, pass them via the step's `env:` block rather than inline `${{ }}` substitution. Inline substitution of JSON containing quotes or special characters causes shell syntax errors. See the example below.

## Example workflow

```yaml
name: opschain-context-demo

on:
  workflow_dispatch:
    inputs:
      project: { type: string, required: true }
      environment: { type: string, required: false }
      asset: { type: string, required: true }
      change_id: { type: string, required: false }
      commit_sha: { type: string, required: false }

jobs:
  opschain:
    name: OpsChain Configuration
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Fetch OpsChain configuration
        id: opschain
        uses: limepoint/opschain-properties@v2
        env:
          OPSCHAIN_API_URL: ${{ secrets.OPSCHAIN_API_URL }}
          OPSCHAIN_USERNAME: ${{ secrets.OPSCHAIN_USERNAME }}
          OPSCHAIN_PASSWORD: ${{ secrets.OPSCHAIN_PASSWORD }}
          # OPSCHAIN_API_AUTH_SCHEME: bearerAuth   # default; omit unless overriding
        with:
          project: ${{ inputs.project }}
          environment: ${{ inputs.environment }}
          asset: ${{ inputs.asset }}
          change_id: ${{ inputs.change_id }}
          commit_sha: ${{ inputs.commit_sha }}

      - name: Use OpsChain configuration
        shell: bash
        env:
          OPSCHAIN_CONTEXT: ${{ steps.opschain.outputs.context }}
          OPSCHAIN_CONFIG: ${{ steps.opschain.outputs.config }}
          OPSCHAIN_ENV: ${{ steps.opschain.outputs.env }}
        run: |
          echo "Change context: $OPSCHAIN_CONTEXT"
          echo "Config:         $OPSCHAIN_CONFIG"
          echo "Env map:        $OPSCHAIN_ENV"
          # Env vars from the env map are also auto-exported, e.g.:
          # echo "MY_OPSCHAIN_VAR=$MY_OPSCHAIN_VAR"
```

To consume an output as a structured object inside a YAML expression, use `fromJSON()`:

```yaml
- run: echo "DB host = ${{ fromJSON(steps.opschain.outputs.config).database.host }}"
```

## Migrating from v1

| v1                                                  | v2                                                                  |
|-----------------------------------------------------|---------------------------------------------------------------------|
| `with: opschain_api_url: ...`                       | `env: OPSCHAIN_API_URL: ...`                                        |
| `with: opschain_api_token: ...` (base64 Basic-Auth) | `env: OPSCHAIN_USERNAME / OPSCHAIN_PASSWORD` (default `bearerAuth`) |
| `with: action: ...`                                 | input removed (was never read by v1)                                |
| `outputs.context_json` / `_encoded`                 | `outputs.context` (drop `_json` / `_encoded` siblings)              |
| `outputs.config_json` / `_encoded`                  | `outputs.config`                                                    |
| `outputs.env_json` / `_encoded`                     | `outputs.env`                                                       |
| `${{ steps.x.outputs.config_json.foo }}`            | `${{ fromJSON(steps.x.outputs.config).foo }}`                       |
| `echo $OPSCHAIN_CONFIG_ENCODED \| base64 -d`        | Pass `OPSCHAIN_CONFIG` via the step `env:` block (no decode needed) |
| `uses: limepoint/opschain-properties@v1`            | `uses: limepoint/opschain-properties@v2`                            |

The `environment` input is still accepted but is no longer used in URL construction (the converged_properties endpoint takes only `project_code` and `asset_code`).
