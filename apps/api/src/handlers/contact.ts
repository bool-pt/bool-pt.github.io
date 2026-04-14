import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { z } from 'zod';
import { contactFormSimpleSchema } from '@bool/shared';
import { getConfig } from '../config.ts';
import { escapeHtml } from '../lib/escape-html.ts';
import { ok, error } from '../lib/response.ts';
import { parseAndValidate, getOrigin } from '../lib/validate.ts';
import { createCaptchaProvider } from '../providers/captcha/index.ts';
import { createEmailProvider } from '../providers/email/index.ts';

const contactApiSchema = contactFormSimpleSchema.extend({
  captchaToken: z.string().min(1, 'Captcha token is required'),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-().]{7,20}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
});

function buildEmailHtml(data: { name: string; email: string; phone?: string; message: string }) {
  const name = escapeHtml(data.name);
  const email = escapeHtml(data.email);
  const phone = data.phone ? escapeHtml(data.phone) : undefined;
  const message = escapeHtml(data.message).replace(/\n/g, '<br />');

  const phoneRow = phone ? `<p><strong>Phone:</strong> ${phone}</p>` : '';
  return `
    <h2>New contact form submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    ${phoneRow}
    <hr />
    <p>${message}</p>
  `.trim();
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const origin = getOrigin(event);

  try {
    const validation = parseAndValidate(event, contactApiSchema);
    if (!validation.success) {
      return error(400, validation.error, origin);
    }

    const { captchaToken, name, email, phone, message } = validation.data;

    const captcha = createCaptchaProvider();
    const captchaResult = await captcha.verify(captchaToken, event.requestContext.http.sourceIp);
    if (!captchaResult.success) {
      return error(403, 'Captcha verification failed', origin);
    }

    const config = getConfig();
    const emailProvider = createEmailProvider();

    await emailProvider.send({
      to: config.sesNotifyEmail,
      from: config.sesFromEmail,
      replyTo: email,
      subject: `Contact form: ${escapeHtml(name)}`,
      html: buildEmailHtml({ name, email, phone, message }),
    });

    return ok(origin);
  } catch {
    return error(500, 'Internal server error', origin);
  }
};
