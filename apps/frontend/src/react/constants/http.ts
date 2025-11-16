import {
  buildHttpBaseUrl,
  resolveHttpConfig,
  resolveProcessEnv,
} from '@apps/common/dist/constants/http';

const { host, port } = resolveHttpConfig(resolveProcessEnv(), {
  hostCandidates: ['REACT_APP_HTTP_HOST', 'HTTP_HOST', 'NEST_HTTP_HOST'],
  portCandidates: ['REACT_APP_HTTP_PORT', 'HTTP_PORT', 'NEST_HTTP_PORT', 'PORT'],
});

export const HTTP_BASE_URL = buildHttpBaseUrl({ host, port });
