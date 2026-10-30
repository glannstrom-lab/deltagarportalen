/**
 * InviteParticipantDialog
 * Dialog för att bjuda in nya deltagare eller skicka kopplingsförfrågan till befintliga
 *
 * Beslut 2026-10-11 (KOPPLINGSFORFRAGAN_FINNS): konsulenten gör SAMMA sak oavsett
 * om adressen har ett konto — en rad i `invitations`. Servern avgör resten
 * (triggern invitations_kopplingsforfragan skapar en förfrågan + notis när kontot
 * finns; send-invite-email skickar då ett "logga in och svara"-mejl i stället för
 * en registreringslänk). Kvittot är detsamma i båda fallen, så dialogen kan inte
 * användas för att ta reda på vem som har ett konto.
 *
 * Premiss (mätt i prod 2026-10-11): konsulentens uppslag i `profiles` nedan ser
 * bara egna deltagare (RLS: consultant_id = uid; admin ser alla). "Har redan ett
 * konto" kunde alltså aldrig nås för någon annans eller en okopplad deltagare —
 * de fick en vanlig inbjudan som föll på "already registered" i generateLink.
 */

import React, { useState, useEffect } from 'react';
import { X, Mail, User, Phone, MessageSquare, CheckCircle, Loader2, UserPlus } from '@/components/ui/icons';
import { supabase } from '@/lib/supabase';
import { Dialog } from '@/components/ui/Dialog';
import { UppladdningDeltagarlistaDialog } from './UppladdningDeltagarlistaDialog';

import { anvandareFranSession } from '@/lib/anvandareFranSession'
import { KOPPLINGSFORFRAGAN_FINNS } from '@/services/kopplingsforfraganApi'
interface InviteParticipantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Flaggan (PENDING_20261011b) — parametern finns för testerna. */
  forfraganAktiv?: boolean;
}

// 'invite-utan-mejl': inbjudan sparad men send-invite-email gick inte igenom.
// Kvittot får då inte säga att deltagaren fått ett mejl (städpasset 2026-09-22).
type SuccessType = 'invite' | 'invite-utan-mejl';

export const InviteParticipantDialog: React.FC<InviteParticipantDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  forfraganAktiv = KOPPLINGSFORFRAGAN_FINNS,
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
  // FN6: samma dialog, två lägen — en deltagare i taget eller en uppladdad lista.
  const [lage, setLage] = useState<'enskild' | 'lista'>('enskild');

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ email: '', firstName: '', lastName: '', phone: '', message: '' });
      setSuccess(null);
      setError(null);
      setLoading(false);
      setLage('enskild');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await anvandareFranSession();
      if (!user) throw new Error('Not authenticated');

      // Kolla om email redan finns. maybeSingle(): 0 rader är det vanliga
      // (mejlet är inte registrerat än) — men ett äkta läsfel ska inte tystas
      // ner till samma sak, för då skapas en inbjudan för ett mejl som
      // kanske redan har ett konto.
      const { data: existingUser, error: existingUserError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, consultant_id')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingUserError) throw existingUserError;

      if (existingUser && forfraganAktiv) {
        // Bara egna deltagare (och för admin: alla) syns här. Redan kopplad till mig
        // är något konsulenten vet — allt annat går vidare som en inbjudan, och servern
        // gör den till en förfrågan om kontot finns.
        if (existingUser.consultant_id === user.id) {
          throw new Error('Denna deltagare är redan kopplad till dig');
        }
      } else if (existingUser) {
        // Användaren finns redan - skicka kopplingsförfrågan

        // Kolla om användaren redan är kopplad till denna konsulent
        if (existingUser.consultant_id === user.id) {
          throw new Error('Denna deltagare är redan kopplad till dig');
        }

        // CR1 (2026-09-29, Mikaels beslut): kopplingsförfrågan är avskriven. Den gick
        // till consultant_requests, som ingen deltagarvy läste och som aldrig kunde
        // besvaras (UPDATE-policyn saknade WITH CHECK) — och dialogen lovade ändå att
        // deltagaren "kommer att se din förfrågan". Säg i stället som det är.
        throw new Error(
          'Den här e-postadressen har redan ett konto hos Jobin. Ett befintligt konto kan inte kopplas till dig härifrån. ' +
            'Be din chef lämna över deltagaren om hen har en annan konsulent, eller kontakta support@jobin.se.'
        );
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

      // Skicka email via Edge Function. `mejlSkickat` är bara sant när funktionen
      // svarat 2xx — allt annat (ingen session, icke-2xx, nätverksfel) betyder
      // att deltagaren INTE fått något mejl.
      let mejlSkickat = false
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
          } else {
            mejlSkickat = true
          }
        }
      } catch (emailErr) {
        console.warn('Could not send email automatically:', emailErr instanceof Error ? emailErr.message : 'Unknown error')
      }

      if (!mejlSkickat) {
        // Ingen autostängning: konsulenten ska hinna läsa att mejlet uteblev.
        // onSuccess körs när hon stänger (se kvittots onClose nedan).
        setSuccess('invite-utan-mejl');
        return;
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

  if (lage === 'lista') {
    return (
      <UppladdningDeltagarlistaDialog
        isOpen={isOpen}
        onClose={onClose}
        onKlar={onSuccess}
        onEnskild={() => setLage('enskild')}
      />
    );
  }

  if (success) {
    return (
      <Dialog
        isOpen={isOpen}
        onClose={success === 'invite-utan-mejl' ? () => { onSuccess(); onClose(); } : onClose}
        labelledBy="invite-success-title"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-8 text-center"
      >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          {success === 'invite-utan-mejl' ? (
            <>
              <h2 id="invite-success-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Inbjudan sparad
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {forfraganAktiv
                  ? <>Men mejlet kunde inte skickas. Hör av dig till {formData.firstName || formData.email} på
                    annat sätt och be hen logga in på Jobin (eller skapa ett konto) med den här e-postadressen.</>
                  : <>Men mejlet kunde inte skickas. Hör av dig till {formData.firstName || formData.email} på
                    annat sätt och be hen registrera sig med den här e-postadressen.</>}
              </p>
              <button
                type="button"
                onClick={() => { onSuccess(); onClose(); }}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
              >
                Stäng
              </button>
            </>
          ) : (
            <>
              <h2 id="invite-success-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Inbjudan skickad!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {formData.firstName || formData.email} har fått en inbjudan via e-post.
              </p>
              {forfraganAktiv && (
                <p className="text-gray-600 dark:text-gray-400 mt-2" data-testid="invite-neutral-kvitto">
                  Har adressen redan ett konto i Jobin är det en förfrågan som hen godkänner själv.
                  Inget delas förrän hen sagt ja. Deltagaren syns i din lista när hen har gått med.
                </p>
              )}
            </>
          )}
      </Dialog>
    );
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="invite-dialog-title"
      className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
    >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 id="invite-dialog-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">Bjud in deltagare</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Skicka en inbjudan via e-post
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Stäng"
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
                <li><strong>Ny användare:</strong> Får en inbjudan via e-post</li>
                {forfraganAktiv
                  ? <li><strong>Har redan ett konto:</strong> Får en förfrågan i Jobin och godkänner själv. Inget delas förrän hen sagt ja.</li>
                  : <li><strong>Har redan ett konto:</strong> Kan inte kopplas härifrån — be din chef lämna över deltagaren</li>}
              </ul>
            </div>
          </div>
        </div>

        <div className="mx-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
          Ska du bjuda in många på en gång?{' '}
          <button
            type="button"
            onClick={() => setLage('lista')}
            className="font-medium text-primary-700 dark:text-primary-300 underline min-h-[44px] px-1"
          >
            Ladda upp en deltagarlista (CSV)
          </button>
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
              E-post *
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
    </Dialog>
  );
};
