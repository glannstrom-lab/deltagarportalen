/**
 * InviteHandler
 * Hanterar inbjudningslänkar för nya användare
 * URL: /invite/:code (parametern bär inbjudans token)
 *
 * STA-grenen (samtyckesblock med två tvingande kryssrutor när
 * metadata.program === 'steg_till_arbete') är borttagen 2026-09-24. STA
 * arkiverades 2026-09-12 och ingen kod skapar sådana inbjudningar längre.
 * En gammal rad med det metadatat får det vanliga formuläret — vaktat av
 * InviteHandler.test.tsx.
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
    message?: string
  }
}

export const InviteHandler: React.FC = () => {
  const { t } = useTranslation();
  // Rutten i App.tsx heter `/invite/:code`. Här stod `useParams().token` —
  // alltid undefined — så RPC:n fick `{ p_token: undefined }` → `{}` →
  // PGRST202, och varje inbjudan var "ogiltig" från 2026-05-22 till 2026-09-22.
  // Vaktas av InviteHandler.test.tsx, som läser ruttmönstret ur App.tsx.
  const { code: token } = useParams<{ code: string }>();
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
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    validateInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const validateInvite = async () => {
    try {
      setValidating(true);

      if (!token) {
        throw new Error(t('auth.invite.invalidOrExpired'));
      }

      // A10 (2026-07-23): tokenmatchad SECURITY DEFINER-RPC i stället för
      // direktläsning — tabellens öppna SELECT-policy är borttagen eftersom
      // den exponerade alla inbjudningar (e-post/telefon/tokens) för anon.
      const { data, error } = await supabase
        .rpc('get_invitation_by_token', { p_token: token })
        .maybeSingle();

      if (error || !data) {
        throw new Error(t('auth.invite.invalidOrExpired'));
      }

      const invite = data as InviteData;
      setInviteData(invite);

      if (invite.metadata) {
        setFormData((prev) => ({
          ...prev,
          firstName: invite.metadata?.first_name || '',
          lastName: invite.metadata?.last_name || '',
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.genericError'));
    } finally {
      setValidating(false);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const validationResult = inviteRegisterSchema.safeParse(formData);
      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        throw new Error(firstError.message);
      }

      // Skapa användare — triggern handle_invitation_acceptance kopplar
      // automatiskt till konsulenten.
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
            {t('auth.invite.accountCreated')}
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
            {t('auth.invite.invitedGeneric')}
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
            disabled={submitting}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('auth.invite.termsNotice')}
        </p>
      </div>
    </div>
  );
};

export default InviteHandler;
