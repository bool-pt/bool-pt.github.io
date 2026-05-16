function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function getConfig() {
  return {
    hcaptchaSecret: requireEnv('HCAPTCHA_SECRET'),
    newsletterTokenSecret: requireEnv('NEWSLETTER_TOKEN_SECRET'),
    sesFromEmail: requireEnv('SES_FROM_EMAIL'),
    sesNotifyEmail: requireEnv('SES_NOTIFY_EMAIL'),
    sesContactList: requireEnv('SES_CONTACT_LIST'),
    corsAllowedOrigin: process.env['CORS_ALLOWED_ORIGIN'] ?? 'https://bool.pt',
    googleServiceAccountKey: process.env['GOOGLE_SERVICE_ACCOUNT_KEY'] ?? '',
    newsletterSheetId: process.env['NEWSLETTER_SHEET_ID'] ?? '',
    contactsSheetId: process.env['CONTACTS_SHEET_ID'] ?? '',
  };
}

export type Config = ReturnType<typeof getConfig>;
