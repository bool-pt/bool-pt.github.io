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

  useImperativeHandle(ref, () => ({ reset }), [reset]);

  return (
    <Turnstile
      ref={turnstileRef}
      siteKey={siteKey}
      onSuccess={onVerify}
      onExpire={onExpire}
      onError={() => onError?.('error')}
      options={{ theme, size }}
    />
  );
}
