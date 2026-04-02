/**
 * ConsultantRequestBanner
 * Visar pending kopplingsförfrågningar från konsulenter till deltagare
 */

import React, { useState, useEffect } from 'react';
import { UserPlus, Check, X, Loader2, MessageSquare } from '@/components/ui/icons';
import { supabase } from '@/lib/supabase';

interface ConsultantRequest {
  id: string;
  consultant_id: string;
  message: string | null;
  created_at: string;
  consultant: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const ConsultantRequestBanner: React.FC = () => {
  const [requests, setRequests] = useState<ConsultantRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('consultant_requests')
        .select(`
          id,
          consultant_id,
          message,
          created_at,
          consultant:profiles!consultant_requests_consultant_id_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .eq('participant_id', user.id)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching consultant requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    setResponding(requestId);
    try {
      const { error } = await supabase.rpc('accept_consultant_request', {
        request_id: requestId
      });

      if (error) throw error;

      // Ta bort från listan
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Kunde inte acceptera förfrågan. Försök igen.');
    } finally {
      setResponding(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setResponding(requestId);
    try {
      const { error } = await supabase.rpc('decline_consultant_request', {
        request_id: requestId
      });

      if (error) throw error;

      // Ta bort från listan
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error('Error declining request:', error);
      alert('Kunde inte neka förfrågan. Försök igen.');
    } finally {
      setResponding(null);
    }
  };

  if (loading || requests.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {requests.map((request) => {
        const consultant = Array.isArray(request.consultant)
          ? request.consultant[0]
          : request.consultant;
        const consultantName = consultant
          ? `${consultant.first_name || ''} ${consultant.last_name || ''}`.trim() || consultant.email
          : 'En konsulent';

        return (
          <div
            key={request.id}
            className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-violet-100 dark:bg-violet-800 rounded-full flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-violet-600 dark:text-violet-300" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Kopplingsförfrågan
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <strong>{consultantName}</strong> vill bli din konsulent och hjälpa dig i din jobbsökning.
                </p>

                {request.message && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                        "{request.message}"
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => handleAccept(request.id)}
                    disabled={responding === request.id}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    {responding === request.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Acceptera
                  </button>
                  <button
                    onClick={() => handleDecline(request.id)}
                    disabled={responding === request.id}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    <X className="w-4 h-4" />
                    Neka
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-400">
                {new Date(request.created_at).toLocaleDateString('sv-SE')}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConsultantRequestBanner;
