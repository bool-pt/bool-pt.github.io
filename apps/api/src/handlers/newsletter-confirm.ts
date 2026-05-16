import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { getConfig } from '../config.ts';
import { getCorsHeaders } from '../lib/cors.ts';
import { verifyToken } from '../lib/token.ts';
import { createNewsletterStore } from '../providers/newsletter/index.ts';
import { createSubscriptionStore } from '../providers/subscriptions/index.ts';

const SUCCESS_REDIRECT = 'https://bool.pt/newsletter/confirmed';
const ERROR_REDIRECT = 'https://bool.pt/newsletter/error';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const token = event.queryStringParameters?.['token'];
    if (!token) {
      return redirect(ERROR_REDIRECT);
    }

    const config = getConfig();
    const result = verifyToken(token, config.newsletterTokenSecret);
    if (!result.valid) {
      return redirect(ERROR_REDIRECT);
    }

    const store = createNewsletterStore();
    await store.subscribe(result.email);

    try {
      const sheetStore = createSubscriptionStore();
      await sheetStore.recordNewsletter({
        email: result.email,
        date: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[sheets-write-failed] newsletter-confirm', err);
    }

    return redirect(SUCCESS_REDIRECT);
  } catch {
    return redirect(ERROR_REDIRECT);
  }
};

function redirect(url: string) {
  return {
    statusCode: 302,
    headers: {
      Location: url,
      ...getCorsHeaders(undefined),
    },
    body: '',
  };
}
