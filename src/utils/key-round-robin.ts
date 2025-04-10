export function* keyRoundRobin(keys: string) {
  const keysArray = keys
    .split(' ')
    .map((key) => key.trim())
    .filter((key) => key.length > 0);

  if (keysArray.length === 0) {
    // 키 배열이 비어있으면 아무것도 반환하지 않습니다.
    return;
  }

  let index = 0;
  while (true) {
    yield keysArray[index];
    index = (index + 1) % keysArray.length;
  }
}
