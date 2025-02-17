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

### `config | config_json`

The OpsChain Properties are available in an output value called `config`. This is available as a JSON string or a JSON object.

### `env | env_json`

The OpsChain ENV variable Properties are available in an output value called `env`. This is available as a JSON string or a JSON object.


Referenced in your subsequent steps as follows:

```yaml
jobs:

  # Get Configration Properties from OpsChain
  configuration:
    name: Test
    runs-on: ubuntu-latest
    timeout-minutes: 5
    outputs:
      config: ${{ steps.configuration.outputs.config }}
      config_json: ${{ steps.configuration.outputs.config_json }}
      context: ${{ steps.configuration.outputs.context }}
      context_json: ${{ steps.configuration.outputs.context_json }}
      env: ${{ steps.configuration.outputs.env }}
      env_json: ${{ steps.configuration.outputs.env_json }}
    steps:
      - name: Configuration
        id: configuration
        uses: limepoint/opschain-properties@v1
        with:
          project: "${{inputs.project}}"
          environment: "${{inputs.environment}}"
          asset: "${{inputs.asset}}"
          change_id: "${{inputs.change_id}}"
          commit_sha: "${{inputs.commit_sha}}"
          opschain_api_url: "${{secrets.OPSCHAIN_API_URL}}"
          opschain_api_token: "${{secrets.OPSCHAIN_API_TOKEN}}"
```

## Important Notes

Your workflow that supports the `workflow_dispatch` event may be triggered from OpsChain directly. The inputs will automatically be passed to your workflow from OpsChain.

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
        required: false
      environment:
        # type: environment
        type: string
        description: 'Environment Code'
        required: false
      asset:
        type: string
        description: 'Asset Code'
        required: false
      action:
        type: string
        description: 'Action'
        required: false
      change_id:
        type: string
        description: 'OpsChain Change ID Reference'
        required: false
      commit_sha:
        type: string
        description: 'OpsChain Git Commit Sha'
        required: false

jobs:

  # Get Configration Properties from OpsChain
  configuration:
    name: Test
    runs-on: ubuntu-latest
    timeout-minutes: 5
    outputs:
      config: ${{ steps.configuration.outputs.config }}
      config_json: ${{ steps.configuration.outputs.config_json }}
      context: ${{ steps.configuration.outputs.context }}
      context_json: ${{ steps.configuration.outputs.context_json }}
      env: ${{ steps.configuration.outputs.env }}
      env_json: ${{ steps.configuration.outputs.env_json }}
    steps:
      - name: Configuration
        id: configuration
        uses: limepoint/opschain-properties@v1
        with:
          project: "${{inputs.project}}"
          environment: "${{inputs.environment}}"
          asset: "${{inputs.asset}}"
          change_id: "${{inputs.change_id}}"
          commit_sha: "${{inputs.commit_sha}}"
          opschain_api_url: "${{secrets.OPSCHAIN_API_URL}}"
          opschain_api_token: "${{secrets.OPSCHAIN_API_TOKEN}}"

  print_output:
    name: Print Workflow Inputs and OpsChain Configuration
    runs-on: ubuntu-latest
    needs: configuration
    timeout-minutes: 5
    steps:
      - name: Checkout repo branch
        uses: actions/checkout@v3
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
          echo "........................."
          echo "Change Context: ${{ needs.jobs.configuration.outputs.context }}"
          echo "Change Context (JSON): ${{ needs.jobs.configuration.outputs.context_json }}"
          echo "Configuration: ${{ needs.jobs.configuration.outputs.config }}"
          echo "Configuration (JSON): ${{ needs.jobs.configuration.outputs.config_json }}"
          echo "ENV Variables: ${{ needs.jobs.configuration.outputs.env }}"
          echo "ENV Variables (JSON): ${{ needs.jobs.configuration.outputs.env_json }}"
```

