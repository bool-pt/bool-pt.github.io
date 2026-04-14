const PRODUCTION_ORIGIN = 'https://bool.pt';

function isAllowedOrigin(origin: string): boolean {
  return origin === PRODUCTION_ORIGIN || /^https?:\/\/localhost:\d+$/.test(origin);
}

export function getCorsHeaders(origin: string | undefined): Record<string, string> {
  const allowed = origin && isAllowedOrigin(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : PRODUCTION_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
