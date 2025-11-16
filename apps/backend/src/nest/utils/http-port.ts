import net from 'node:net';

const DEFAULT_MAX_PORT_ATTEMPTS = 20;

function testPortAvailability(port: number, host: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    const onError = (error: NodeJS.ErrnoException) => {
      server.removeListener('listening', onListening);

      if (error.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        reject(error);
      }
    };

    const onListening = () => {
      server.removeListener('error', onError);
      server.close(() => {
        resolve(true);
      });
    };

    server.once('error', onError);
    server.once('listening', onListening);

    try {
      server.listen({ host, port, exclusive: true });
    } catch (error) {
      server.removeListener('error', onError);
      server.removeListener('listening', onListening);
      reject(error);
    }
  });
}

export async function findAvailablePort(
  preferredPort: number,
  host: string,
  maxAttempts = DEFAULT_MAX_PORT_ATTEMPTS
): Promise<number> {
  const attempts = Math.max(1, maxAttempts);
  let candidate = preferredPort;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const isAvailable = await testPortAvailability(candidate, host);

    if (isAvailable) {
      return candidate;
    }

    candidate += 1;
  }

  throw new Error(
    `포트 ${preferredPort}부터 ${candidate - 1}까지 사용 중입니다. 사용 가능한 포트를 찾을 수 없습니다.`
  );
}
