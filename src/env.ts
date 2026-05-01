import * as core from "@actions/core";

const SECRET_VAULT_PREFIX = "secret-vault://";

export function exportEnv(env: Record<string, string>): void {
  for (const [key, value] of Object.entries(env)) {
    if (value.startsWith(SECRET_VAULT_PREFIX)) {
      core.info(`  ... env var [${key}] is an OpsChain secret reference; masking value`);
      core.setSecret(value);
    }
    core.exportVariable(key, value);
  }
}
