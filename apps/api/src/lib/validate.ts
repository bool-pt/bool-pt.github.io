import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { z } from 'zod';

export function parseAndValidate<T extends z.ZodType>(
  event: APIGatewayProxyEventV2,
  schema: T,
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  if (!event.body) {
    return { success: false, error: 'Request body is required' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(event.body);
  } catch {
    return { success: false, error: 'Invalid JSON in request body' };
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message).join(', ');
    return { success: false, error: `Validation failed: ${messages}` };
  }

  return { success: true, data: result.data as z.infer<T> };
}

export function getOrigin(event: APIGatewayProxyEventV2): string | undefined {
  return event.headers['origin'];
}
