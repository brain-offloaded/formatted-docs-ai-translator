// 모든 whitespace로 split함
export const splitByWhitespace = (input: string): string[] => {
  return input
    .split(/\s+/)
    .map((key) => key.trim())
    .filter((key) => key.length > 0);
};

const getKeysArraySignature = (keysArray: string[]): string => {
  return keysArray.sort().join('||');
};

function* roundRobinValues(values: string[]) {
  if (values.length === 0) return;

  let index = Math.floor(Math.random() * values.length); // 콜드스타트 편향 방지
  while (true) {
    yield values[index];
    index = (index + 1) % values.length;
  }
}

const generatorMap = new Map<string, Generator<string>>();

export function keyRoundRobin(keys: string): Generator<string> | undefined {
  // split with any whitespace
  const keysArray = splitByWhitespace(keys);

  if (keysArray.length === 0) return undefined;

  const signature = getKeysArraySignature(keysArray);
  if (!generatorMap.has(signature)) {
    const generator = roundRobinValues(keysArray);
    generatorMap.set(signature, generator);
  }

  return generatorMap.get(signature);
}
