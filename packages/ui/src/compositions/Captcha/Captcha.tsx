import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useRef, useCallback, useImperativeHandle } from 'react';

type CaptchaProvider = 'hcaptcha';

interface CaptchaProps {
  provider?: CaptchaProvider;
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: string) => void;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact' | 'invisible';
  ref?: React.Ref<CaptchaHandle>;
}

export interface CaptchaHandle {
  reset: () => void;
  execute: () => void;
}

export default function Captcha({
  provider = 'hcaptcha',
  siteKey,
  onVerify,
  onExpire,
  onError,
  theme = 'dark',
  size = 'normal',
  ref,
}: CaptchaProps) {
  const hcaptchaRef = useRef<HCaptcha>(null);

  const reset = useCallback(() => {
    hcaptchaRef.current?.resetCaptcha();
  }, []);

  const execute = useCallback(() => {
    hcaptchaRef.current?.execute();
  }, []);

  useImperativeHandle(ref, () => ({ reset, execute }), [reset, execute]);

  if (provider === 'hcaptcha') {
    return (
      <HCaptcha
        ref={hcaptchaRef}
        sitekey={siteKey}
        onVerify={onVerify}
        onExpire={onExpire}
        onError={onError}
        theme={theme}
        size={size}
      />
    );
  }

  return null;
}
