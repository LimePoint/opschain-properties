import * as core from "@actions/core";
import type { TransportOptions, AuthScheme } from "@opschain/api-client";

const VALID_SCHEMES: readonly AuthScheme[] = ["bearerAuth", "basicAuth", "cookieAuth"];

export class AuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthConfigError";
  }
}

export function resolveAuthOptions(): TransportOptions {
  const baseUrl = process.env.OPSCHAIN_API_URL?.trim();
  const username = process.env.OPSCHAIN_USERNAME?.trim();
  const password = process.env.OPSCHAIN_PASSWORD?.trim();
  const rawScheme = process.env.OPSCHAIN_API_AUTH_SCHEME?.trim() || "bearerAuth";

  if (!VALID_SCHEMES.includes(rawScheme as AuthScheme)) {
    throw new AuthConfigError(
      `Invalid OPSCHAIN_API_AUTH_SCHEME: "${rawScheme}". Must be one of: ${VALID_SCHEMES.join(", ")}.`,
    );
  }
  const authScheme = rawScheme as AuthScheme;

  const missing: string[] = [];
  if (!baseUrl) missing.push("OPSCHAIN_API_URL");
  if (!username) missing.push("OPSCHAIN_USERNAME");
  if (!password) missing.push("OPSCHAIN_PASSWORD");
  if (missing.length > 0) {
    throw new AuthConfigError(`Missing required environment variable(s): ${missing.join(", ")}.`);
  }

  core.setSecret(username!);
  core.setSecret(password!);

  return {
    baseUrl,
    username,
    password,
    authScheme,
  };
}
