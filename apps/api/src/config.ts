function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function getConfig() {
  return {
    hcaptchaSecret: requireEnv('HCAPTCHA_SECRET'),
    sesFromEmail: requireEnv('SES_FROM_EMAIL'),
    sesNotifyEmail: requireEnv('SES_NOTIFY_EMAIL'),
    sesContactList: requireEnv('SES_CONTACT_LIST'),
    corsAllowedOrigin: process.env['CORS_ALLOWED_ORIGIN'] ?? 'https://bool.pt',
  };
}

export type Config = ReturnType<typeof getConfig>;
