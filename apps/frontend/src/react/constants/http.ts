const DEFAULT_HTTP_PORT = 3333;
const DEFAULT_HTTP_HOST = '127.0.0.1';

const resolveEnv = (): NodeJS.ProcessEnv | undefined => {
  if (typeof process === 'undefined') {
    return undefined;
  }
  return process.env;
};

const env = resolveEnv();

const resolvedHost =
  env?.REACT_APP_HTTP_HOST ?? env?.HTTP_HOST ?? env?.NEST_HTTP_HOST ?? DEFAULT_HTTP_HOST;

const resolvedPortRaw =
  env?.REACT_APP_HTTP_PORT ?? env?.HTTP_PORT ?? env?.NEST_HTTP_PORT ?? env?.PORT;

const parsedPort = Number(resolvedPortRaw);
const httpPort = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_HTTP_PORT;

export const HTTP_BASE_URL = `http://${resolvedHost}:${httpPort}`;
