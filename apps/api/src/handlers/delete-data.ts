import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { z } from 'zod';
import { ok, error } from '../lib/response.ts';
import { parseAndValidate, getOrigin } from '../lib/validate.ts';
import { createNewsletterStore } from '../providers/newsletter/index.ts';
import { createSubscriptionStore } from '../providers/subscriptions/index.ts';

const deleteSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * GDPR Article 17 — Right to erasure.
 * Removes the email from SES Contact List and from both Google Sheets
 * (newsletter subscribers + contact form submissions).
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

    try {
      const sheetStore = createSubscriptionStore();
      await Promise.all([
        sheetStore.removeNewsletter(validation.data.email),
        sheetStore.removeContact(validation.data.email),
      ]);
    } catch (err) {
      console.error('[sheets-write-failed] delete-data', err);
    }

    return ok(origin);
  } catch {
    return error(500, 'Internal server error', origin);
  }
};
