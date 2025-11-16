import { resolveHttpConfig, resolveProcessEnv } from '@apps/common/dist/constants/http';

const { host, port } = resolveHttpConfig(resolveProcessEnv(), {
  hostCandidates: ['NEST_HTTP_HOST', 'HTTP_HOST', 'REACT_APP_HTTP_HOST'],
  portCandidates: ['NEST_HTTP_PORT', 'PORT', 'HTTP_PORT', 'REACT_APP_HTTP_PORT'],
});

export const HTTP_HOST = host;
export const HTTP_PORT = port;
