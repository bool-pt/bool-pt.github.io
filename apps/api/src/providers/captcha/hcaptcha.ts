import type { CaptchaProvider } from './types.ts';

const VERIFY_URL = 'https://api.hcaptcha.com/siteverify';

export class HCaptchaProvider implements CaptchaProvider {
  constructor(private readonly secret: string) {}

  async verify(token: string, remoteIp?: string): Promise<{ success: boolean }> {
    const params = new URLSearchParams({
      secret: this.secret,
      response: token,
      ...(remoteIp && { remoteip: remoteIp }),
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);

    try {
      const res = await fetch(VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`hCaptcha verification request failed with status ${res.status}`);
      }

      const data = (await res.json()) as { success: boolean };
      return { success: data.success };
    } finally {
      clearTimeout(timeout);
    }
  }
}
