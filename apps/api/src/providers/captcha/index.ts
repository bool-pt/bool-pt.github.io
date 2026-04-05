import { getConfig } from '../../config.ts';
import { HCaptchaProvider } from './hcaptcha.ts';
import type { CaptchaProvider } from './types.ts';

export type { CaptchaProvider };

export function createCaptchaProvider(): CaptchaProvider {
  return new HCaptchaProvider(getConfig().hcaptchaSecret);
}
