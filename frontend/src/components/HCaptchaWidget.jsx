import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

const SITE_KEY = process.env.REACT_APP_HCAPTCHA_SITEKEY || '10000000-ffff-ffff-ffff-000000000001';

const HCaptchaWidget = forwardRef(({ onVerify, onExpire, onError, theme = 'light', size = 'normal' }, ref) => {
  const captchaRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getToken: () => captchaRef.current?.getResponse() || null,
    reset: () => captchaRef.current?.resetCaptcha(),
    execute: () => captchaRef.current?.execute(),
  }));

  return (
    <div data-testid="hcaptcha-widget" className="flex justify-center">
      <HCaptcha
        ref={captchaRef}
        sitekey={SITE_KEY}
        onVerify={(token) => onVerify?.(token)}
        onExpire={() => {
          onExpire?.();
        }}
        onError={(err) => {
          onError?.(err);
        }}
        theme={theme}
        size={size}
      />
    </div>
  );
});

HCaptchaWidget.displayName = 'HCaptchaWidget';

export default HCaptchaWidget;
