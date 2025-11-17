const DEFAULT_HTTP_HOST = '127.0.0.1';
const DEFAULT_HTTP_PORT = 3333;
const DEFAULT_HOST_ENV_ORDER = ['NEST_HTTP_HOST', 'HTTP_HOST', 'REACT_APP_HTTP_HOST'];
const DEFAULT_PORT_ENV_ORDER = ['NEST_HTTP_PORT', 'PORT', 'HTTP_PORT', 'REACT_APP_HTTP_PORT'];

export interface HttpResolutionOptions {
  hostCandidates?: string[];
  portCandidates?: string[];
  defaultHost?: string;
  defaultPort?: number;
}

export interface HttpHostPort {
  host: string;
  port: number;
}

function isNonEmptyString(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parsePortValue(value: string | undefined): number | undefined {
  if (!isNonEmptyString(value)) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

export function resolveHttpConfig(
  env?: NodeJS.ProcessEnv,
  options: HttpResolutionOptions = {}
): HttpHostPort {
  const candidates = {
    host: options.hostCandidates ?? [...DEFAULT_HOST_ENV_ORDER],
    port: options.portCandidates ?? [...DEFAULT_PORT_ENV_ORDER],
  };

  const resolvedHost =
    candidates.host
      .map((key) => env?.[key])
      .find((value): value is string => isNonEmptyString(value)) ??
    options.defaultHost ??
    DEFAULT_HTTP_HOST;

  const resolvedPort =
    candidates.port
      .map((key) => parsePortValue(env?.[key]))
      .find((value): value is number => typeof value === 'number') ??
    options.defaultPort ??
    DEFAULT_HTTP_PORT;

  return {
    host: resolvedHost,
    port: resolvedPort,
  };
}

export function buildHttpBaseUrl(
  config: HttpHostPort,
  protocol: 'http' | 'https' = 'http'
): string {
  return `${protocol}://${config.host}:${config.port}`;
}

export function resolveProcessEnv(): NodeJS.ProcessEnv | undefined {
  if (typeof process === 'undefined' || typeof process.env === 'undefined') {
    return undefined;
  }

  return process.env;
}
