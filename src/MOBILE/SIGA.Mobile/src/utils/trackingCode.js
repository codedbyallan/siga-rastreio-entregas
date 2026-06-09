function generateRandomBlock(size = 6) {
  return Math.random()
    .toString(36)
    .slice(2, 2 + size)
    .toUpperCase();
}

export function generateTrackingCode(prefix = "SIGA") {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomA = generateRandomBlock(4);
  const randomB = generateRandomBlock(4);

  return `${prefix}-${timestamp}-${randomA}${randomB}`;
}