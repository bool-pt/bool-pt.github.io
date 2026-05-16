import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { z } from 'zod';
import { newsletterSchema } from '@bool/shared';
import { getConfig } from '../config.ts';
import { escapeHtml } from '../lib/escape-html.ts';
import { ok, error } from '../lib/response.ts';
import { generateToken } from '../lib/token.ts';
import { parseAndValidate, getOrigin } from '../lib/validate.ts';
import { createCaptchaProvider } from '../providers/captcha/index.ts';
import { createEmailProvider } from '../providers/email/index.ts';

const newsletterApiSchema = newsletterSchema.extend({
  captchaToken: z.string().min(1, 'Captcha token is required'),
});

const CONFIRM_BASE_URL = 'https://bool.pt/newsletter/confirm';

function buildConfirmationHtml(confirmUrl: string, name: string): string {
  const escapedUrl = escapeHtml(confirmUrl);
  const escapedName = escapeHtml(name);
  return `
    <h2>Hi ${escapedName}, confirm your newsletter subscription</h2>
    <p>Click the link below to confirm your subscription to the Bool newsletter:</p>
    <p><a href="${escapedUrl}">Confirm subscription</a></p>
    <p>If you did not request this, you can safely ignore this email.</p>
    <p>This link expires in 24 hours.</p>
  `.trim();
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const origin = getOrigin(event);

  try {
    const validation = parseAndValidate(event, newsletterApiSchema);
    if (!validation.success) {
      return error(400, validation.error, origin);
    }

    const { captchaToken, email, name } = validation.data;

    const captcha = createCaptchaProvider();
    const captchaResult = await captcha.verify(captchaToken, event.requestContext.http.sourceIp);
    if (!captchaResult.success) {
      return error(403, 'Captcha verification failed', origin);
    }

    const config = getConfig();
    const token = generateToken(email, config.newsletterTokenSecret);
    const confirmUrl = `${CONFIRM_BASE_URL}?token=${token}`;

    const emailProvider = createEmailProvider();
    await emailProvider.send({
      to: email,
      from: config.sesFromEmail,
      subject: 'Confirm your Bool newsletter subscription',
      html: buildConfirmationHtml(confirmUrl, name),
    });

    return ok(origin);
  } catch {
    return error(500, 'Internal server error', origin);
  }
};
