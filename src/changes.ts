import type { OpsChainClient } from "@opschain/api-client";

export async function fetchChange(
  client: OpsChainClient,
  changeId: string,
): Promise<Record<string, unknown>> {
  return await client.changes.get(changeId);
}
