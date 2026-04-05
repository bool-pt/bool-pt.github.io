import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { z } from 'zod';
import { newsletterSchema } from '@bool/shared';
import { ok, error } from '../lib/response.ts';
import { parseAndValidate, getOrigin } from '../lib/validate.ts';
import { createCaptchaProvider } from '../providers/captcha/index.ts';
import { createNewsletterStore } from '../providers/newsletter/index.ts';

const newsletterApiSchema = newsletterSchema.extend({
  captchaToken: z.string().min(1, 'Captcha token is required'),
});

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const origin = getOrigin(event);

  const validation = parseAndValidate(event, newsletterApiSchema);
  if (!validation.success) {
    return error(400, validation.error, origin);
  }

  const { captchaToken, email } = validation.data;

  const captcha = createCaptchaProvider();
  const captchaResult = await captcha.verify(
    captchaToken,
    event.requestContext.http.sourceIp,
  );
  if (!captchaResult.success) {
    return error(403, 'Captcha verification failed', origin);
  }

  const store = createNewsletterStore();
  await store.subscribe(email);

  return ok(origin);
};
