/**
 * InviteParticipantDialog
 * Dialog för att bjuda in nya deltagare eller skicka kopplingsförfrågan till befintliga
 */

import React, { useState, useEffect } from 'react';
import { X, Mail, User, Phone, MessageSquare, CheckCircle, Loader2, UserPlus, Link2 } from '@/components/ui/icons';
import { supabase } from '@/lib/supabase';

interface InviteParticipantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type SuccessType = 'invite' | 'request';

export const InviteParticipantDialog: React.FC<InviteParticipantDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ email: '', firstName: '', lastName: '', phone: '', message: '' });
      setSuccess(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Kolla om email redan finns
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, consultant_id')
        .eq('email', formData.email)
        .single();

      if (existingUser) {
        // Användaren finns redan - skicka kopplingsförfrågan

        // Kolla om användaren redan är kopplad till denna konsulent
        if (existingUser.consultant_id === user.id) {
          throw new Error('Denna deltagare är redan kopplad till dig');
        }

        // Kolla om det redan finns en pending förfrågan
        const { data: existingRequest } = await supabase
          .from('consultant_requests')
          .select('id, status')
          .eq('consultant_id', user.id)
          .eq('participant_id', existingUser.id)
          .single();

        if (existingRequest) {
          if (existingRequest.status === 'PENDING') {
            throw new Error('Du har redan skickat en förfrågan till denna deltagare');
          } else if (existingRequest.status === 'DECLINED') {
            // Ta bort den nekade förfrågan och skapa en ny
            await supabase
              .from('consultant_requests')
              .delete()
              .eq('id', existingRequest.id);
          }
        }

        // Skapa kopplingsförfrågan
        const { error: requestError } = await supabase
          .from('consultant_requests')
          .insert({
            consultant_id: user.id,
            participant_id: existingUser.id,
            message: formData.message || null,
          });

        if (requestError) throw requestError;

        setSuccess('request');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
        return;
      }

      // Användaren finns inte - skapa inbjudan
      const { data, error: inviteError } = await supabase
        .from('invitations')
        .insert({
          email: formData.email,
          role: 'USER',
          invited_by: user.id,
          consultant_id: user.id,
          metadata: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            message: formData.message,
          },
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Skicka email via Edge Function
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session && data) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
          const emailResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-invite-email`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ invitationId: data.id })
            }
          )
          if (!emailResponse.ok) {
            console.warn('Email sending failed:', emailResponse.status, emailResponse.statusText)
          }
        }
      } catch (emailErr) {
        console.warn('Could not send email automatically:', emailErr instanceof Error ? emailErr.message : 'Unknown error')
      }

      setSuccess('invite');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte skicka inbjudan');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          {success === 'invite' ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Inbjudan skickad!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {formData.firstName || formData.email} har fått en inbjudan via email.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Kopplingsförfrågan skickad!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Användaren finns redan och kommer att se din förfrågan nästa gång de loggar in.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Bjud in deltagare</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Skicka inbjudan eller kopplingsförfrågan
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Info box */}
        <div className="mx-6 mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">Så fungerar det:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400">
                <li><strong>Ny användare:</strong> Får en inbjudan via email</li>
                <li><strong>Befintlig användare:</strong> Får en kopplingsförfrågan att acceptera</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Förnamn
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Anna"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Efternamn
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Andersson"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="anna@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Telefon
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="070-123 45 67"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Personligt meddelande (valfritt)
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={3}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Hej! Jag är din nya konsulent och vill hjälpa dig..."
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={loading || !formData.email}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Skickar...
                  </>
                ) : (
                  'Skicka'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
