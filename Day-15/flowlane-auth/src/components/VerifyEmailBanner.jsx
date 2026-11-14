import { useState } from 'react';
import { MailWarning } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import '../styles/account.css';

/** Shown to password accounts until the link in the verification email has been opened */
export default function VerifyEmailBanner() {
  const { user, resendVerification, refreshUser } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const [working, setWorking] = useState(false);

  if (!user || user.emailVerified || !user.providerIds?.includes('password')) return null;

  const resend = async () => {
    setWorking(true);
    const ok = await resendVerification();
    setWorking(false);
    if (ok) toast.success(t('account.verify.sent'));
    else toast.error(t('account.verify.sendFailed'));
  };

  const check = async () => {
    setWorking(true);
    try {
      const fresh = await refreshUser();
      if (fresh?.emailVerified) toast.success(t('account.verify.nowVerified'));
      else toast.info(t('account.verify.stillNot'));
    } catch {
      toast.error(t('account.verify.refreshFailed'));
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="verify-banner" role="status">
      <MailWarning size={18} aria-hidden="true" />
      <p>{t('account.verify.banner', { email: user.email })}</p>
      <div className="verify-banner__actions">
        <button type="button" onClick={resend} disabled={working}>{t('account.verify.resend')}</button>
        <button type="button" onClick={check} disabled={working}>{t('account.verify.check')}</button>
      </div>
    </div>
  );
}
