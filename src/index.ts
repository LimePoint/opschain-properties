import * as core from "@actions/core";
import { createClient, describeError } from "./client.js";
import { fetchChange } from "./changes.js";
import { fetchConvergedProperties } from "./properties.js";
import { exportEnv } from "./env.js";

async function run(): Promise<void> {
  const project = core.getInput("project", { required: true });
  const environment = core.getInput("environment");
  const asset = core.getInput("asset", { required: true });
  const changeId = core.getInput("change_id");
  const commitSha = core.getInput("commit_sha");

  core.info(`Project: ${project}`);
  if (environment) core.info(`Environment: ${environment}`);
  core.info(`Asset: ${asset}`);
  if (changeId) core.info(`Change ID: ${changeId}`);
  if (commitSha) core.info(`Commit SHA: ${commitSha}`);

  const client = createClient();

  if (changeId) {
    core.info(`Fetching change context for change_id=${changeId}`);
    const change = await fetchChange(client, changeId);
    core.setOutput("context", JSON.stringify(change));
  } else {
    core.warning("change_id not provided; context output will be empty");
    core.setOutput("context", "");
  }

  const envSuffix = environment ? ` environment=${environment}` : "";
  core.info(`Fetching converged properties for project=${project}${envSuffix} asset=${asset}`);
  const { config, env } = await fetchConvergedProperties(client, project, asset, environment || undefined);

  core.setOutput("config", JSON.stringify(config));
  core.setOutput("env", JSON.stringify(env));

  core.info("Exporting OpsChain env vars to GitHub workflow environment");
  exportEnv(env);
}

run().catch((error: unknown) => {
  core.setFailed(describeError(error));
});
