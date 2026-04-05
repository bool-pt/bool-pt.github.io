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

    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) {
      throw new Error(`hCaptcha verification request failed with status ${res.status}`);
    }

    const data = (await res.json()) as { success: boolean };
    return { success: data.success };
  }
}
