import { OpsChainClient, OpsChainAPIError } from "@opschain/api-client";
import { resolveAuthOptions } from "./auth.js";

export function createClient(): OpsChainClient {
  return new OpsChainClient(resolveAuthOptions());
}

export function describeError(error: unknown): string {
  if (error instanceof OpsChainAPIError) {
    const id = error.requestId ? ` request_id=${error.requestId}` : "";
    return `${error.name} (${error.statusCode}) on ${error.url}${id}: ${error.body || error.message}`;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}
