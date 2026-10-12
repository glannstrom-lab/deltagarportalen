/**
 * Share Job Dialog
 * Låter användare dela ett jobb med sin arbetskonsulent
 */

import React, { useState, useEffect, useEffectEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Send, X, CheckCircle, User } from '@/components/ui/icons';
import { shareJobWithConsultant } from '@/services/jobSharingService';
import type { ShareJobRequest } from '@/services/jobSharingService';
import { getProfile } from '@/lib/supabase';
import { anvandareFranSession } from '@/lib/anvandareFranSession';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';

interface ShareJobDialogProps {
  jobId: string;
  jobData: ShareJobRequest['jobData'];
  isOpen: boolean;
  onClose: () => void;
  onShared?: () => void;
}

export const ShareJobDialog: React.FC<ShareJobDialogProps> = ({
  jobId,
  jobData,
  isOpen,
  onClose,
  onShared,
}) => {
  const { t } = useTranslation();
  const [consultantId, setConsultantId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingConsultant, setIsFetchingConsultant] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Hämta användarens konsulent vid öppning
  const hamtaKonsulent = useEffectEvent(() => fetchConsultant());
  useEffect(() => {
    if (isOpen) {
      hamtaKonsulent();
    }
  }, [isOpen]);

  const fetchConsultant = async () => {
    setIsFetchingConsultant(true);
    setError(null);

    try {
      const { data: { user } } = await anvandareFranSession();
      if (!user) {
        setError(t('jobs.share.notLoggedIn', 'Du måste vara inloggad'));
        return;
      }

      // Hämta profil för att se om det finns en tilldelad konsulent
      const { data: profile, error: profileError } = await getProfile(user.id);
      
      if (profileError || !profile?.consultant_id) {
        setError(t('jobs.share.noConsultant', 'Du har ingen tilldelad konsulent. Kontakta din handläggare.'));
        return;
      }

      setConsultantId(profile.consultant_id);
    } catch {
      setError(t('jobs.share.fetchFailed', 'Kunde inte hämta konsulentinformation'));
    } finally {
      setIsFetchingConsultant(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consultantId) {
      setError(t('jobs.share.noneAssigned', 'Ingen konsulent tilldelad'));
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await shareJobWithConsultant({
      jobId,
      jobData,
      consultantId,
      message: message.trim() || undefined,
    });

    setIsLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onShared?.();
        onClose();
        setSuccess(false);
        setMessage('');
      }, 1500);
    } else {
      setError(result.error || t('jobs.share.failed', 'Kunde inte dela jobbet'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="sharejobdialog-title" className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 id="sharejobdialog-title" className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary-600" aria-hidden="true" />
            {t('jobs.share.title', 'Dela med konsulent')}
          </h2>
          <button
            onClick={onClose}
            aria-label={t('jobs.share.close', 'Stäng')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isFetchingConsultant ? (
            <LoadingState message={t('jobs.share.loading', 'Hämtar konsulent …')} size="sm" />
          ) : success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('jobs.share.sharedTitle', 'Jobbet har delats!')}
              </h3>
              <p className="text-gray-600">
                {t('jobs.share.sharedBody', 'Din konsulent har fått en notifikation och kommer att granska jobbet.')}
              </p>
            </div>
          ) : error ? (
            <ErrorState
              title={t('jobs.share.failed', 'Kunde inte dela jobbet')}
              message={error}
              onRetry={fetchConsultant}
              onCancel={onClose}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Jobb-info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {jobData.headline}
                </h3>
                <p className="text-gray-600 text-sm">
                  {jobData.employer?.name}
                </p>
                {jobData.workplace_address && (
                  <p className="text-gray-500 text-xs mt-1">
                    {jobData.workplace_address.municipality}
                  </p>
                )}
              </div>

              {/* Konsulent-info */}
              <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-primary-900">{t('jobs.share.yourConsultant', 'Din konsulent')}</p>
                  <p className="text-sm text-primary-700">{t('jobs.share.getsNotified', 'Får notifikation om detta')}</p>
                </div>
              </div>

              {/* Meddelande */}
              <div>
                <label htmlFor="sharejobdialog-f1" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('jobs.share.messageLabel', 'Personligt meddelande (valfritt)')}
                </label>
                <textarea
                  id="sharejobdialog-f1"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('jobs.share.messagePlaceholder', 'T.ex. ”Detta jobb verkar perfekt för mig! Vad tycker du?”')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {message.length}/500
                </p>
              </div>

              {/* Knappar */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('jobs.share.cancel', 'Avbryt')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('jobs.share.sending', 'Skickar …')}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {t('jobs.share.submit', 'Dela jobb')}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareJobDialog;
