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

      // FIX: invitations-tabellen har ingen status-kolumn — använd used_at IS NULL.
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        throw new Error('Inbjudan är ogiltig eller har gått ut');
      }

      setInviteData(data);

      if (data.metadata) {
        setFormData((prev) => ({
          ...prev,
          firstName: data.metadata.first_name || '',
          lastName: data.metadata.last_name || '',
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setValidating(false);
      setLoading(false);
    }
  };

  const isStaInvite = inviteData?.metadata?.program === 'steg_till_arbete';
  const consultantName = inviteData?.metadata?.consultant_first_name
    ? `${inviteData.metadata.consultant_first_name} ${inviteData.metadata.consultant_last_name ?? ''}`.trim()
    : 'Din konsulent';

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
        throw new Error('Du måste godkänna samtycket för att fortsätta');
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
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ogiltig inbjudan</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Gå till inloggning
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Konto skapat!</h2>
          <p className="text-gray-600 mb-6">
            {isStaInvite
              ? 'Ditt konto är skapat och Steg till arbete är aktiverat. Du omdirigeras till inloggningen…'
              : 'Ditt konto har skapats. Du omdirigeras till inloggningen…'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Välkommen!</h1>
          <p className="text-gray-600 mt-2">
            {isStaInvite
              ? `${consultantName} har bjudit in dig till Steg till arbete`
              : 'Du har blivit inbjuden till Jobin'}
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
              <h3 className="font-semibold text-stone-900">Din konsulent</h3>
            </div>
            <div className="p-5 space-y-1">
              <p className="text-stone-900 font-medium">{consultantName}</p>
              {inviteData?.metadata?.consultant_email && (
                <p className="text-sm text-stone-600">{inviteData.metadata.consultant_email}</p>
              )}
              <p className="text-xs text-stone-500 mt-2">
                Du kan kontakta din konsulent direkt eller från "Min konsulent"-sidan när du loggat in.
              </p>
            </div>
          </div>
        )}

        {isStaInvite && (
          <div className="mb-6 border border-stone-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-stone-50 border-b border-stone-200 flex items-center gap-2">
              <Shield className="w-5 h-5 text-stone-600" />
              <h3 className="font-semibold text-stone-900">Samtycke till datadelning</h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-stone-700 whitespace-pre-line">
                {inviteData?.metadata?.consent_text ?? 'Samtyckes-text saknas — kontakta din konsulent.'}
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
                    Jag samtycker till att <strong>{consultantName}</strong> får tillgång till min STA-data
                    (aktiviteter, skattningar, CV, mående, dokument) och kan skicka rapporter till
                    Arbetsförmedlingen för min räkning.
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
                    Jag förstår att jag <strong>när som helst kan säga upp kopplingen</strong> från
                    "Min konsulent"-sidan. Då slutar konsulenten se ny aktivitet, men dokument som
                    redan skickats till Arbetsförmedlingen behålls enligt arkivkraven.
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Förnamn *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Efternamn *</label>
              <input
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Lösenord *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Minst 12 tecken"
                autoComplete="new-password"
              />
            </div>
            <ul className="mt-2 text-xs text-gray-500 space-y-0.5">
              <li className={formData.password.length >= 12 ? 'text-green-600' : ''}>
                {formData.password.length >= 12 ? '✓' : '○'} Minst 12 tecken
              </li>
              <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>
                {/[A-Z]/.test(formData.password) ? '✓' : '○'} En stor bokstav (A-Z)
              </li>
              <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : ''}>
                {/[a-z]/.test(formData.password) ? '✓' : '○'} En liten bokstav (a-z)
              </li>
              <li className={/[0-9]/.test(formData.password) ? 'text-green-600' : ''}>
                {/[0-9]/.test(formData.password) ? '✓' : '○'} En siffra (0-9)
              </li>
              <li className={/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-600' : ''}>
                {/[^A-Za-z0-9]/.test(formData.password) ? '✓' : '○'} Ett specialtecken (!@#$%^&*)
              </li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bekräfta lösenord *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Upprepa lösenord"
                autoComplete="new-password"
              />
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">Lösenorden matchar inte</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !consentOk}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            title={!consentOk ? 'Du måste godkänna samtycket först' : undefined}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Skapar konto…
              </>
            ) : (
              'Skapa konto'
            )}
          </button>
          {isStaInvite && !consentOk && (
            <p className="text-xs text-stone-500 text-center">
              Bocka i båda samtyckes-rutorna ovan för att aktivera knappen.
            </p>
          )}
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Genom att skapa ett konto godkänner du våra användarvillkor.
        </p>
      </div>
    </div>
  );
};

export default InviteHandler;
