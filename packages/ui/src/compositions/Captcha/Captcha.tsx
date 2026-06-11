import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { useCallback, useImperativeHandle, useRef } from 'react';

interface CaptchaProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: string) => void;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'flexible' | 'compact';
  ref?: React.Ref<CaptchaHandle>;
}

export interface CaptchaHandle {
  reset: () => void;
  /**
   * Runs the challenge on demand and resolves with the verification token.
   * Resolves to an empty string if the widget is unavailable, errors, or times out.
   */
  execute: () => Promise<string>;
}

export default function Captcha({
  siteKey,
  onVerify,
  onExpire,
  onError,
  theme = 'dark',
  size = 'normal',
  ref,
}: CaptchaProps) {
  const turnstileRef = useRef<TurnstileInstance>(null);

  const reset = useCallback(() => {
    turnstileRef.current?.reset();
  }, []);

  const execute = useCallback(async () => {
    const widget = turnstileRef.current;
    if (!widget) return '';
    const existing = widget.getResponse();
    if (existing) return existing;
    try {
      widget.execute();
      return await widget.getResponsePromise();
    } catch {
      return '';
    }
  }, []);

  useImperativeHandle(ref, () => ({ reset, execute }), [reset, execute]);

  return (
    <Turnstile
      ref={turnstileRef}
      siteKey={siteKey}
      onSuccess={onVerify}
      onExpire={onExpire}
      onError={() => onError?.('error')}
      // `execution: 'execute'` defers the challenge until execute() is called on
      // submit; `interaction-only` keeps the widget hidden unless interaction is
      // actually required.
      options={{ theme, size, appearance: 'interaction-only', execution: 'execute' }}
    />
  );
}
