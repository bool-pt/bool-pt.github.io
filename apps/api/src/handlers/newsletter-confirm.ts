import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { getConfig } from '../config.ts';
import { getCorsHeaders } from '../lib/cors.ts';
import { verifyToken } from '../lib/token.ts';
import { createNewsletterStore } from '../providers/newsletter/index.ts';

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
