# OpsChain Properties Action

This action downloads the Configuration Properties from OpsChain Change that can be referenced and used within GitHub Actions Jobs and Steps

## Inputs

### `project`

**Required** The OpsChain Project Code

### `environment`

**Optional** The OpsChain Environment Code

### `asset`

**Optional** The OpsChain Asset Code

### `change_id`

**Optional** The OpsChain Change ID

### `commit_sha`

**Optional** The OpsChain Commit SHA used

### `opschain_api_url`

**Required** The OpsChain API URL Endpoint

### `opschain_api_token`

**Required** The OpsChain API Authentication Token

## Outputs

### `context | context_json | context_encoded`

The OpsChain Change Context is available in an output value called `context`. This is available as a JSON string, JSON object, or Base64 Encoded string.

### `config | config_json | config_encoded`

The OpsChain Asset Properties are available in an output value called `config`. This is available as a JSON string, JSON object, or Base64 Encoded string.

### `env | env_json | env_encoded`

The OpsChain ENV variable Properties are available in an output value called `env`. This is available as a JSON string, JSON object, or Base64 Encoded string.

**Note:** ENV variable properties are set as GitHub Environment variables and will be accessible via the standard `env.ENV_VARIABLE` notation in your GitHub workflow.

## Important Notes

GitHub workflows that supports the `workflow_dispatch` event may be triggered from OpsChain directly. The inputs will automatically be passed to your Github workflow from OpsChain.

In order to do so, please ensure your Workflow has the following `inputs` defined:

```yaml
on:
  workflow_dispatch:
    inputs:
      project:
        # The value of this parameter is a string specifying the data type of the input. 
        # This must be one of: boolean, choice, number, environment or string.
        type: string
        description: 'Project Code'
        required: true
      environment:
        # type: environment
        type: string
        description: 'Environment Code'
        required: false
      asset:
        type: string
        description: 'Asset Code'
        required: true
      action:
        type: string
        description: 'Action'
        required: true
      change_id:
        type: string
        description: 'OpsChain Change ID Reference'
        required: true
      commit_sha:
        type: string
        description: 'OpsChain Git Commit Sha'
        required: true
```

## Example usage

Workflow Example below.

```yaml
name: test

on:
  workflow_dispatch:
    inputs:
      project:
        # The value of this parameter is a string specifying the data type of the input. 
        # This must be one of: boolean, choice, number, environment or string.
        type: string
        description: 'Project Code'
        required: true
      environment:
        # type: environment
        type: string
        description: 'Environment Code'
        required: false
      asset:
        type: string
        description: 'Asset Code'
        required: true
      action:
        type: string
        description: 'Action'
        required: true
      change_id:
        type: string
        description: 'OpsChain Change ID Reference'
        required: true
      commit_sha:
        type: string
        description: 'OpsChain Git Commit Sha'
        required: true
env:
  AZ_TENANT_ID: 'UNKNOWN'  
  AZ_SUBSCRIPTION_ID: 'UNKNOWN'  
  AZ_SERVICE_PRINCIPAL_CLIENT_ID: 'UNKNOWN'  
  AZ_SERVICE_PRINCIPAL_CLIENT_SECRET: 'UNKNOWN'  

jobs:

  print_initial_env:
    name: Print Workflow ENV Variables (Initial)
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Print Workflow ENV Variables
        shell: bash
        run: |
          echo "... Printing Workflow ENV Variables"
          echo "+==================================================+"
          echo "ENV[AZ_TENANT_ID] is: ${{ env.AZ_TENANT_ID }}"
          echo "ENV[AZ_SUBSCRIPTION_ID] is: ${{ env.AZ_SUBSCRIPTION_ID }}"
          echo "ENV[AZ_SERVICE_PRINCIPAL_CLIENT_ID] is: ${{ env.AZ_SERVICE_PRINCIPAL_CLIENT_ID }}"
          echo "ENV[AZ_SERVICE_PRINCIPAL_CLIENT_SECRET] is: ${{ env.AZ_SERVICE_PRINCIPAL_CLIENT_SECRET }}"
          echo "+==================================================+"

  # Get Configration Properties from OpsChain
  opschain:
    name: OpsChain Configuration
    needs: print_initial_env
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: OpsChain Configuration
        id: opschain
        uses: limepoint/opschain-properties@v1
        with:
          project: "${{inputs.project}}"
          environment: "${{inputs.environment}}"
          asset: "${{inputs.asset}}"
          change_id: "${{inputs.change_id}}"
          commit_sha: "${{inputs.commit_sha}}"
          opschain_api_url: "${{secrets.OPSCHAIN_API_URL}}"
          opschain_api_token: "${{secrets.OPSCHAIN_API_TOKEN}}"

      - name: Print Workflow Inputs
        run: |
          echo "... Workflow Inputs"
          echo "........................."
          echo "Project: "${{ inputs.project }} 
          echo "Environment: "${{ inputs.environment }} 
          echo "Asset: "${{ inputs.asset }} 
          echo "Action: "${{ inputs.action }} 
          echo "Change ID: "${{ inputs.change_id }} 
          echo "Commit SHA: "${{ inputs.commit_sha }}
          echo "...done."

      - name: Print OpsChain Configuration
        shell: bash
        run: |
          echo "... Printing OpsChain Configuration"
          echo "+==================================================+"
          echo "Change Context: ${{ steps.opschain.outputs.context }}"
          echo "--------"
          echo "Change Context (JSON): ${{ steps.opschain.outputs.context_json }}"
          echo "--------"
          echo "Change Context (Encoded): ${{ steps.opschain.outputs.context_encoded }}"
          echo "--------"
          echo "${{ steps.opschain.outputs.context_encoded }}" | base64 -d
          echo "........................."
          echo "Configuration: ${{ steps.opschain.outputs.config }}"
          echo "--------"
          echo "Configuration (JSON): ${{ steps.opschain.outputs.config_json }}"
          echo "--------"
          echo "Configuration (Encoded): ${{ steps.opschain.outputs.config_encoded }}"
          echo "--------"
          echo "${{ steps.opschain.outputs.config_encoded }}" | base64 -d
          echo "........................."
          echo "ENV Variables: ${{ steps.opschain.outputs.env }}"
          echo "--------"
          echo "ENV Variables (JSON): ${{ steps.opschain.outputs.env_json }}"
          echo "--------"
          echo "ENV Variables (Encoded): ${{ steps.opschain.outputs.env_encoded }}"
          echo "--------"
          echo "${{ steps.opschain.outputs.env_encoded }}" | base64 -d
          echo "--------"
          echo "ENV[AZ_TENANT_ID] is: ${{ env.AZ_TENANT_ID }}"
          echo "ENV[AZ_SUBSCRIPTION_ID] is: ${{ env.AZ_SUBSCRIPTION_ID }}"
          echo "ENV[AZ_SERVICE_PRINCIPAL_CLIENT_ID] is: ${{ env.AZ_SERVICE_PRINCIPAL_CLIENT_ID }}"
          echo "ENV[AZ_SERVICE_PRINCIPAL_CLIENT_SECRET] is: ${{ env.AZ_SERVICE_PRINCIPAL_CLIENT_SECRET }}"
          echo "+==================================================+"
```

