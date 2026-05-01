import type { OpsChainClient } from "@opschain/api-client";

export interface ConvergedProperties {
  config: Record<string, unknown>;
  env: Record<string, string>;
}

export async function fetchConvergedProperties(
  client: OpsChainClient,
  projectCode: string,
  assetCode: string,
): Promise<ConvergedProperties> {
  const path = `/api/projects/${encodeURIComponent(projectCode)}/assets/${encodeURIComponent(assetCode)}/converged_properties`;
  const response = await client.transport.request("GET", path);

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const requestId = response.headers.get("x-request-id");
    const idSuffix = requestId ? ` request_id=${requestId}` : "";
    throw new Error(
      `Failed to fetch converged_properties (HTTP ${response.status}) on ${response.url}${idSuffix}: ${body}`,
    );
  }

  const body = (await response.json()) as { data?: { attributes?: { data?: unknown } } };
  const attributesData = body?.data?.attributes?.data;
  if (!attributesData || typeof attributesData !== "object") {
    throw new Error("Unexpected converged_properties response shape: missing data.attributes.data");
  }

  const fullConfig = { ...(attributesData as Record<string, unknown>) };
  const opschain = (fullConfig["opschain"] as { env?: Record<string, string> } | undefined) ?? {};
  const rawEnv = opschain.env ?? {};
  delete fullConfig["opschain"];

  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawEnv)) {
    if (k.startsWith("GITHUB_")) continue;
    env[k] = String(v);
  }

  return { config: fullConfig, env };
}
