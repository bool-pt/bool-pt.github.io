import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { z } from 'zod';
import { ok, error } from '../lib/response.ts';
import { parseAndValidate, getOrigin } from '../lib/validate.ts';
import { createNewsletterStore } from '../providers/newsletter/index.ts';
import { createSubscriptionStore } from '../providers/subscriptions/index.ts';

const unsubscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const origin = getOrigin(event);

  try {
    const validation = parseAndValidate(event, unsubscribeSchema);
    if (!validation.success) {
      return error(400, validation.error, origin);
    }

    const store = createNewsletterStore();
    await store.unsubscribe(validation.data.email);

    try {
      const sheetStore = createSubscriptionStore();
      await sheetStore.removeNewsletter(validation.data.email);
    } catch (err) {
      console.error('[sheets-write-failed] unsubscribe', err);
    }

    return ok(origin);
  } catch {
    return error(500, 'Internal server error', origin);
  }
};
