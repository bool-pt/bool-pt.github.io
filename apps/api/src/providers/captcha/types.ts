export interface CaptchaProvider {
  verify(token: string, remoteIp?: string): Promise<{ success: boolean }>;
}
