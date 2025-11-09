const DEFAULT_HTTP_PORT = 3333;
const DEFAULT_HTTP_HOST = '127.0.0.1';

const env = process.env;

const resolvedHost =
  env.NEST_HTTP_HOST ?? env.HTTP_HOST ?? env.REACT_APP_HTTP_HOST ?? DEFAULT_HTTP_HOST;

const resolvedPortRaw = env.NEST_HTTP_PORT ?? env.PORT ?? env.HTTP_PORT ?? env.REACT_APP_HTTP_PORT;

const parsedPort = Number(resolvedPortRaw);

export const HTTP_HOST = resolvedHost;
export const HTTP_PORT =
  Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_HTTP_PORT;
