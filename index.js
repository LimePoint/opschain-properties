const core = require('@actions/core');
const github = require('@actions/github');

try {
  // inputs defined in action metadata file
  const project = core.getInput('project');
  console.info(`Project: ${project}`);
  const environment = core.getInput('environment');
  console.log(`Environment: ${environment}`);
  const asset = core.getInput('asset');
  console.log(`Asset: ${asset}`);
  const action = core.getInput('action');
  console.log(`Action: ${action}`);
  const change_id = core.getInput('change_id');
  console.log(`Change ID: ${change_id}`);
  const commit_sha = core.getInput('commit_sha');
  console.log(`Commit SHA: ${commit_sha}`);
  const OPSCHAIN_API_URL = core.getInput('opschain_api_url');
  console.log(`OPSCHAIN_API_URL: ${OPSCHAIN_API_URL}`);
  const OPSCHAIN_API_TOKEN = core.getInput('opschain_api_token');
  console.log(`OPSCHAIN_API_TOKEN: ${OPSCHAIN_API_TOKEN}`);

  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.debug(`The event payload: ${payload}`);

  let apiContextUrlString = `${OPSCHAIN_API_URL}/api/projects/${project}`;
  let apiPropertiesUrlString = `${OPSCHAIN_API_URL}/api/projects/${project}`;
  if (!!environment) {
    apiContextUrlString = apiContextUrlString + `/environments/${environment}`;
    apiPropertiesUrlString = apiPropertiesUrlString + `/environments/${environment}`;
  }
  if (!!asset) {
    apiContextUrlString = apiContextUrlString + `/assets/${asset}`;
    apiPropertiesUrlString = apiPropertiesUrlString + `/assets/${asset}/converged_properties`;
  }
  if (!!change_id) {
    apiContextUrlString = apiContextUrlString + `/changes/${change_id}`;
  }

  const apiContextUrl = apiContextUrlString.toString().replace(/["']/g, "");
  const apiPropertiesUrl = apiPropertiesUrlString.toString().replace(/["']/g, "");
  const apiKey = `${OPSCHAIN_API_TOKEN}`.toString();

  console.debug(`apiContextUrl: ${apiContextUrl}`);
  console.debug(`apiPropertiesUrl: ${apiPropertiesUrl}`);
  console.debug(`apiKey: ${apiKey}`);

  const requestOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${apiKey}`,
    },
  };

  if (!!change_id) {
    core.info('... calling OpsChain API to obtain Configuration for Change with ID: ' + `${change_id}`)
    fetch(apiContextUrl, requestOptions)
      .then(response => {
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Data not found');
          } else if (response.status === 500) {
            throw new Error('Server error');
          } else {
            throw new Error('Network response was not ok');
          }
        }
        return response.json();
      })
      .then(data => {
        const config = JSON.stringify(data.data, null, 2)

        const encodedContextString = btoa(config);
        console.debug(encodedContextString);

        core.info('... setting GitHub Output (context|context_json)')
        core.setOutput("context", config);
        core.setOutput("context_json", JSON.parse(config));
        core.setOutput("context_encoded", encodedContextString);

        console.debug(`The context payload: ${config}`);

        // Note: relationships on properties only persisted AFTER change completion.
        // console.debug(`The properties relationship payload: ${JSON.stringify(data.data.relationships.properties, null, 2)}`);
        // console.debug(`... looking up OpsChain Properties`);
        // const apiUrlProperties = (`${OPSCHAIN_API_URL}` + '/api/projects/').toString().replace(/["']/g, "");
        // console.debug(`The apiUrlProperties: ${apiUrlProperties}`);

      })
      .catch(error => {
        console.error('Error:', error);
        core.setFailed(error.message);
      });

    } else {
      core.warning('... Input Change ID has not been provided. GitHub Output (context|context_json) skipped.')      
      core.setOutput("context", "");
      core.setOutput("context_json", "");
      core.setOutput("context_encoded", "");
    }

    // Now lets lookup the Properties (Config and Environment Variable Properties)
    fetch(apiPropertiesUrl, requestOptions)
      .then(response => {
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Data not found');
          } else if (response.status === 500) {
            throw new Error('Server error');
          } else {
            throw new Error('Network response was not ok');
          }
        }
        return response.json();
      })
      .then(data => {
        let config = data.data.attributes.data
        let env = data.data.attributes.data.opschain.env
        delete config.opschain
        const all = JSON.stringify(data, null, 2)
        console.debug(`The ALL Properties payload: ${all}`);
        console.debug(`The config payload: ${JSON.stringify(config, null, 2)}`);
        console.debug(`The env payload: ${JSON.stringify(env, null, 2)}`);

        const encodedConfigString = btoa(JSON.stringify(config, null, 2));
        console.debug(encodedConfigString);

        core.info('... setting GitHub Output (config|config_json)')
        core.setOutput("config", JSON.stringify(config, null, 2));
        core.setOutput("config_json", config);
        core.setOutput("config_encoded", encodedConfigString);

        const encodedEnvString = btoa(JSON.stringify(env, null, 2));
        console.debug(encodedEnvString);

        core.info('... setting GitHub Output (env|env_json)')
        core.setOutput("env", JSON.stringify(env, null, 2));
        core.setOutput("env_json", env);
        core.setOutput("env_encoded", encodedEnvString);

        try {
          core.info('... setting GitHub Environment Variables and Secrets')
          for (const key in env) {
            // console.debug(`Variable: ${key}: ${env[key]}`);
            let val = `${env[key]}`;
            if (`${key}`.toString().startsWith('GITHUB_'))  {
              // Variable is a GITHUB_ variable. Do not export/set these ones
              core.info('  ... Environment Variable [ ' + `${key}` + ' ] is a GITHUB_ variable. Skipping.');
            } else {
              if (`${env[key]}`.toString().startsWith('secret-vault://')) {
                core.info('  ... Environment Variable [ ' + `${key}` + ' ] contains an OpsChain Secret');
                // TODO Lookup Secret from OpsChain
                core.info('    ... getting OpsChain Secret for Key [ ' + `${key}` + ' ]');
                core.info('        // TODO LOOKUP OPSCHAIN SECRET');
                val = `${env[key]}`
                core.info('    ... setting GitHub Secret for Key [' + `${key}` + ' ]');
                // TODO Set Secret
                // See https://github.com/actions/toolkit/tree/main/packages/core#setting-a-secret
                core.setSecret(`${val}`);
                core.info('    ... GitHub Secret value for Key [' + `${key}` + ' ] is: ' + `${val}`);
              }
              core.info('  ... setting GitHub Environment Variable for [ ' + `${key}` + ' ]');
              // See https://github.com/actions/toolkit/tree/main/packages/core#exporting-variables
              core.exportVariable(`${key}`, `${val}`);
              core.info('    ... Environment Variable [' + `${key}` + ' ] value is: ' + `${val}`);
            }
          }

        }
        catch (err) {
          // setFailed logs the message and sets a failing exit code
          core.setFailed(`Action failed with error ${err}`);
        }

      })
      .catch(error => {
        console.error('Error:', error);
        core.setFailed(error.message);
      });
  
} catch (error) {
  core.setFailed(error.message);
}

