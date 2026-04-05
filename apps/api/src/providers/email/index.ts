import { SesEmailProvider } from './ses.ts';
import type { EmailProvider } from './types.ts';

export type { EmailProvider, EmailMessage } from './types.ts';

export function createEmailProvider(): EmailProvider {
  return new SesEmailProvider();
}
