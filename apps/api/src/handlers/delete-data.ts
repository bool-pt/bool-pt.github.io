import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { z } from 'zod';
import { ok, error } from '../lib/response.ts';
import { parseAndValidate, getOrigin } from '../lib/validate.ts';
import { createNewsletterStore } from '../providers/newsletter/index.ts';

const deleteSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * GDPR Article 17 — Right to erasure.
 * Permanently deletes all data associated with the given email address.
 * Currently this covers: newsletter subscription (SES Contact List).
 * Contact form submissions are not stored (fire-and-forget email),
 * so there is no data to delete for those.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const origin = getOrigin(event);

  try {
    const validation = parseAndValidate(event, deleteSchema);
    if (!validation.success) {
      return error(400, validation.error, origin);
    }

    const store = createNewsletterStore();
    await store.delete(validation.data.email);

    return ok(origin);
  } catch {
    return error(500, 'Internal server error', origin);
  }
};
