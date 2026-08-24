/**
 * InviteHandler
 * Hanterar inbjudningslänkar för nya användare
 * URL: /invite/:token
 *
 * När inbjudan har metadata.program === 'steg_till_arbete' visas ett samtyckes-
 * block med två kryssrutor som krävs innan kontot kan skapas. Samtycket sparas
 * automatiskt i consultant_consents via handle_invitation_acceptance-triggern.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  UserCheck,
} from '@/components/ui/icons';
import { supabase } from '@/lib/supabase';
import { inviteRegisterSchema } from '@/lib/validations';

interface InviteData {
  id: string
  email: string
  role: string
  consultant_id?: string
  invited_by?: string
  metadata?: {
    first_name?: string
    last_name?: string
    phone?: string
    program?: string
    sta_enrollment_id?: string
    consent_text?: string
    consultant_first_name?: string
    consultant_last_name?: string
    consultant_email?: string
    message?: string
  }
}

export const InviteHandler: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });
  const [consentDataSharing, setConsentDataSharing] = useState(false);
  const [consentRevocation, setConsentRevocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    validateInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const validateInvite = async () => {
    try {
      setValidating(true);

      // A10 (2026-07-23): tokenmatchad SECURITY DEFINER-RPC i stället för
      // direktläsning — tabellens öppna SELECT-policy är borttagen eftersom
      // den exponerade alla inbjudningar (e-post/telefon/tokens) för anon.
      const { data, error } = await supabase
        .rpc('get_invitation_by_token', { p_token: token })
        .maybeSingle();

      if (error || !data) {
        throw new Error(t('auth.invite.invalidOrExpired'));
      }

      setInviteData(data as InviteData);

      if (data.metadata) {
        setFormData((prev) => ({
          ...prev,
          firstName: data.metadata.first_name || '',
          lastName: data.metadata.last_name || '',
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.genericError'));
    } finally {
      setValidating(false);
      setLoading(false);
    }
  };

  const isStaInvite = inviteData?.metadata?.program === 'steg_till_arbete';
  const consultantName = inviteData?.metadata?.consultant_first_name
    ? `${inviteData.metadata.consultant_first_name} ${inviteData.metadata.consultant_last_name ?? ''}`.trim()
    : t('auth.invite.yourConsultant');

  const consentOk = !isStaInvite || (consentDataSharing && consentRevocation);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const validationResult = inviteRegisterSchema.safeParse(formData);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        throw new Error(firstError.message);
      }

      if (isStaInvite && !consentOk) {
        throw new Error(t('auth.invite.consentRequired'));
      }

      // Skapa användare — triggern handle_invitation_acceptance kopplar
      // automatiskt till konsulenten + aktiverar STA-programmet om inbjudan
      // har metadata.program satt.
      const { error: authError } = await supabase.auth.signUp({
        email: inviteData!.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      });

      if (authError) throw authError;

      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('auth.invite.invalidTitle')}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            {t('auth.invite.goToLogin')}
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('auth.invite.accountCreatedTitle')}</h2>
          <p className="text-gray-600 mb-6">
            {isStaInvite
              ? t('auth.invite.accountCreatedSta')
              : t('auth.invite.accountCreated')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.invite.welcome')}</h1>
          <p className="text-gray-600 mt-2">
            {isStaInvite
              ? t('auth.invite.invitedBySta', { consultantName })
              : t('auth.invite.invitedGeneric')}
          </p>
          <div className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-500">
            <Mail className="w-4 h-4" />
            {inviteData?.email}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {isStaInvite && (
          <div className="mb-6 border border-stone-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-stone-50 border-b border-stone-200 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-stone-600" />
              <h3 className="font-semibold text-stone-900">{t('auth.invite.yourConsultant')}</h3>
            </div>
            <div className="p-5 space-y-1">
              <p className="text-stone-900 font-medium">{consultantName}</p>
              {inviteData?.metadata?.consultant_email && (
                <p className="text-sm text-stone-600">{inviteData.metadata.consultant_email}</p>
              )}
              <p className="text-xs text-stone-500 mt-2">
                {t('auth.invite.contactConsultantHint')}
              </p>
            </div>
          </div>
        )}

        {isStaInvite && (
          <div className="mb-6 border border-stone-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-stone-50 border-b border-stone-200 flex items-center gap-2">
              <Shield className="w-5 h-5 text-stone-600" />
              <h3 className="font-semibold text-stone-900">{t('auth.invite.consentHeading')}</h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-stone-700 whitespace-pre-line">
                {inviteData?.metadata?.consent_text ?? t('auth.invite.consentTextMissing')}
              </p>

              <div className="space-y-3 pt-2 border-t border-stone-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentDataSharing}
                    onChange={(e) => setConsentDataSharing(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-stone-800">
                    {t('auth.invite.consentDataSharingPrefix')} <strong>{consultantName}</strong>{' '}
                    {t('auth.invite.consentDataSharingSuffix')}
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentRevocation}
                    onChange={(e) => setConsentRevocation(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-stone-800">
                    {t('auth.invite.consentRevocationPrefix')}{' '}
                    <strong>{t('auth.invite.consentRevocationBold')}</strong>{' '}
                    {t('auth.invite.consentRevocationSuffix')}
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="invitehandler-f1" className="block text-sm font-medium text-gray-700 mb-1">{t('auth.invite.firstNameLabel')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="invitehandler-f1"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Anna"
                />
              </div>
            </div>
            <div>
              <label htmlFor="invitehandler-f2" className="block text-sm font-medium text-gray-700 mb-1">{t('auth.invite.lastNameLabel')}</label>
              <input
                id="invitehandler-f2"
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Andersson"
              />
            </div>
          </div>

          <div>
            <label htmlFor="invitehandler-f3" className="block text-sm font-medium text-gray-700 mb-1">{t('auth.invite.passwordLabel')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="invitehandler-f3"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder={t('auth.invite.passwordMinLength')}
                autoComplete="new-password"
              />
            </div>
            <ul className="mt-2 text-xs text-gray-500 space-y-0.5">
              <li className={formData.password.length >= 12 ? 'text-green-600' : ''}>
                {formData.password.length >= 12 ? '✓' : '○'} {t('auth.invite.passwordMinLength')}
              </li>
              <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>
                {/[A-Z]/.test(formData.password) ? '✓' : '○'} {t('auth.invite.reqUpper')}
              </li>
              <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : ''}>
                {/[a-z]/.test(formData.password) ? '✓' : '○'} {t('auth.invite.reqLower')}
              </li>
              <li className={/[0-9]/.test(formData.password) ? 'text-green-600' : ''}>
                {/[0-9]/.test(formData.password) ? '✓' : '○'} {t('auth.invite.reqDigit')}
              </li>
              <li className={/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-600' : ''}>
                {/[^A-Za-z0-9]/.test(formData.password) ? '✓' : '○'} {t('auth.invite.reqSpecial')}
              </li>
            </ul>
          </div>

          <div>
            <label htmlFor="invitehandler-f4" className="block text-sm font-medium text-gray-700 mb-1">{t('auth.invite.confirmPasswordLabel')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="invitehandler-f4"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder={t('auth.invite.repeatPasswordPlaceholder')}
                autoComplete="new-password"
              />
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{t('auth.invite.passwordMismatch')}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !consentOk}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            title={!consentOk ? t('auth.invite.consentRequiredTitle') : undefined}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('auth.invite.creatingAccount')}
              </>
            ) : (
              t('auth.invite.createAccountButton')
            )}
          </button>
          {isStaInvite && !consentOk && (
            <p className="text-xs text-stone-500 text-center">
              {t('auth.invite.checkBothBoxesHint')}
            </p>
          )}
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('auth.invite.termsNotice')}
        </p>
      </div>
    </div>
  );
};

export default InviteHandler;
