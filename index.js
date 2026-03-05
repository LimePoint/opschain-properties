const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  // inputs defined in action metadata file
  const project = core.getInput('project');
  core.info(`Project: ${project}`);
  const environment = core.getInput('environment');
  core.info(`Environment: ${environment}`);
  const asset = core.getInput('asset');
  core.info(`Asset: ${asset}`);
  const action = core.getInput('action');
  core.info(`Action: ${action}`);
  const change_id = core.getInput('change_id');
  core.info(`Change ID: ${change_id}`);
  const commit_sha = core.getInput('commit_sha');
  core.info(`Commit SHA: ${commit_sha}`);
  const OPSCHAIN_API_URL = core.getInput('opschain_api_url');
  core.info(`OPSCHAIN_API_URL: ${OPSCHAIN_API_URL}`);
  const OPSCHAIN_API_TOKEN = core.getInput('opschain_api_token');
  core.setSecret(OPSCHAIN_API_TOKEN);

  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2);
  core.debug(`The event payload: ${payload}`);

  let apiContextUrlString = `${OPSCHAIN_API_URL}/api/projects/${project}`;
  let apiPropertiesUrlString = `${OPSCHAIN_API_URL}/api/projects/${project}`;
  if (environment) {
    apiContextUrlString += `/environments/${environment}`;
    apiPropertiesUrlString += `/environments/${environment}`;
  }
  if (asset) {
    apiContextUrlString += `/assets/${asset}`;
    apiPropertiesUrlString += `/assets/${asset}/converged_properties`;
  }
  if (change_id) {
    apiContextUrlString += `/changes/${change_id}`;
  }

  const apiContextUrl = apiContextUrlString.replace(/["']/g, "");
  const apiPropertiesUrl = apiPropertiesUrlString.replace(/["']/g, "");

  core.debug(`apiContextUrl: ${apiContextUrl}`);
  core.debug(`apiPropertiesUrl: ${apiPropertiesUrl}`);

  const requestOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${OPSCHAIN_API_TOKEN}`,
    },
  };

  // Fetch Change Context
  if (change_id) {
    core.info('... calling OpsChain API to obtain Configuration for Change with ID: ' + change_id);
    const data = await fetchJson(apiContextUrl, requestOptions);
    const contextString = JSON.stringify(data.data, null, 2);
    const encodedContextString = Buffer.from(contextString).toString('base64');
    core.debug(encodedContextString);

    core.info('... setting GitHub Output (context|context_json|context_encoded)');
    core.setOutput("context", contextString);
    core.setOutput("context_json", data.data);
    core.setOutput("context_encoded", encodedContextString);

    core.debug(`The context payload: ${contextString}`);
  } else {
    core.warning('... Input Change ID has not been provided. GitHub Output (context|context_json) skipped.');
    core.setOutput("context", "");
    core.setOutput("context_json", "");
    core.setOutput("context_encoded", "");
  }

  // Fetch Properties (Config and Environment Variable Properties)
  const data = await fetchJson(apiPropertiesUrl, requestOptions);
  const config = { ...data.data.attributes.data };
  const env = { ...config.opschain.env };
  delete config.opschain;

  // Strip GITHUB_ prefixed variables
  for (const key in env) {
    if (key.startsWith('GITHUB_')) {
      core.info('... stripping ENV Variable [ ' + key + ' ] from GitHub Output');
      delete env[key];
    }
  }

  core.debug(`The ALL Properties payload: ${JSON.stringify(data, null, 2)}`);
  core.debug(`The config payload: ${JSON.stringify(config, null, 2)}`);
  core.debug(`The env payload: ${JSON.stringify(env, null, 2)}`);

  const encodedConfigString = Buffer.from(JSON.stringify(config, null, 2)).toString('base64');
  core.debug(encodedConfigString);

  core.info('... setting GitHub Output (config|config_json|config_encoded)');
  core.setOutput("config", JSON.stringify(config, null, 2));
  core.setOutput("config_json", config);
  core.setOutput("config_encoded", encodedConfigString);

  const encodedEnvString = Buffer.from(JSON.stringify(env, null, 2)).toString('base64');
  core.debug(encodedEnvString);

  core.info('... setting GitHub Output (env|env_json|env_encoded)');
  core.setOutput("env", JSON.stringify(env, null, 2));
  core.setOutput("env_json", env);
  core.setOutput("env_encoded", encodedEnvString);

  // Set GitHub Environment Variables and Secrets
  core.info('... setting GitHub Environment Variables and Secrets');
  for (const key in env) {
    let val = String(env[key]);
    if (val.startsWith('secret-vault://')) {
      core.info('  ... Environment Variable [ ' + key + ' ] contains an OpsChain Secret');
      core.info('    ... getting OpsChain Secret for Key [ ' + key + ' ]');
      // TODO Lookup Secret from OpsChain
      core.info('    ... setting GitHub Secret for Key [' + key + ' ]');
      core.setSecret(val);
    }
    core.info('  ... setting GitHub Environment Variable for [ ' + key + ' ]');
    core.exportVariable(key, val);
  }
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Data not found (404) for ${url}`);
    } else if (response.status === 500) {
      throw new Error(`Server error (500) for ${url}`);
    } else {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }
  }
  return response.json();
}

run().catch(error => {
  core.setFailed(error.message);
});
