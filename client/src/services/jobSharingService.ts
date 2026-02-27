/**
 * Job Sharing Service
 * Hanterar delning av jobb med arbetskonsulenter
 */

import { supabase } from '@/lib/supabase';

export interface SharedJob {
  id: string;
  jobId: string;
  jobData: {
    headline: string;
    employer: { name: string };
    description?: string;
    workplace_address?: { municipality: string; region: string };
    application_details?: { url?: string; email?: string };
  };
  participantId: string;
  consultantId: string;
  message?: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  consultantNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShareJobRequest {
  jobId: string;
  jobData: SharedJob['jobData'];
  consultantId: string;
  message?: string;
}

/**
 * Dela ett jobb med konsulent
 */
export async function shareJobWithConsultant(
  request: ShareJobRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Du måste vara inloggad för att dela jobb' };
    }

    const { error } = await supabase.from('shared_jobs').insert({
      job_id: request.jobId,
      job_data: request.jobData,
      participant_id: user.id,
      consultant_id: request.consultantId,
      message: request.message,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error sharing job:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sharing job:', error);
    return { success: false, error: 'Ett oväntat fel inträffade' };
  }
}

/**
 * Hämta delade jobb för en deltagare
 */
export async function getSharedJobs(): Promise<SharedJob[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return [];

    const { data, error } = await supabase
      .from('shared_jobs')
      .select('*')
      .eq('participant_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shared jobs:', error);
      return [];
    }

    return data.map(mapSharedJobFromDB);
  } catch (error) {
    console.error('Error fetching shared jobs:', error);
    return [];
  }
}

/**
 * Hämta delade jobb för en konsulent (inkommande)
 */
export async function getIncomingSharedJobs(consultantId: string): Promise<SharedJob[]> {
  try {
    const { data, error } = await supabase
      .from('shared_jobs')
      .select('*')
      .eq('consultant_id', consultantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching incoming shared jobs:', error);
      return [];
    }

    return data.map(mapSharedJobFromDB);
  } catch (error) {
    console.error('Error fetching incoming shared jobs:', error);
    return [];
  }
}

/**
 * Uppdatera status på delat jobb (för konsulent)
 */
export async function updateSharedJobStatus(
  sharedJobId: string,
  status: SharedJob['status'],
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const update: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (notes) {
      update.consultant_notes = notes;
    }

    const { error } = await supabase
      .from('shared_jobs')
      .update(update)
      .eq('id', sharedJobId);

    if (error) {
      console.error('Error updating shared job:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating shared job:', error);
    return { success: false, error: 'Ett oväntat fel inträffade' };
  }
}

/**
 * Radera ett delat jobb
 */
export async function deleteSharedJob(sharedJobId: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase
      .from('shared_jobs')
      .delete()
      .eq('id', sharedJobId);

    if (error) {
      console.error('Error deleting shared job:', error);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting shared job:', error);
    return { success: false };
  }
}

/**
 * Hämta statistik för delade jobb
 */
export async function getSharedJobsStats(
  consultantId: string
): Promise<{
  total: number;
  pending: number;
  reviewed: number;
  approved: number;
  rejected: number;
}> {
  try {
    const { data, error } = await supabase
      .from('shared_jobs')
      .select('status')
      .eq('consultant_id', consultantId);

    if (error) {
      console.error('Error fetching stats:', error);
      return { total: 0, pending: 0, reviewed: 0, approved: 0, rejected: 0 };
    }

    const stats = {
      total: data.length,
      pending: data.filter(j => j.status === 'pending').length,
      reviewed: data.filter(j => j.status === 'reviewed').length,
      approved: data.filter(j => j.status === 'approved').length,
      rejected: data.filter(j => j.status === 'rejected').length,
    };

    return stats;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { total: 0, pending: 0, reviewed: 0, approved: 0, rejected: 0 };
  }
}

/**
 * Mappa från databasformat till intern typ
 */
function mapSharedJobFromDB(dbRecord: any): SharedJob {
  return {
    id: dbRecord.id,
    jobId: dbRecord.job_id,
    jobData: dbRecord.job_data,
    participantId: dbRecord.participant_id,
    consultantId: dbRecord.consultant_id,
    message: dbRecord.message,
    status: dbRecord.status,
    consultantNotes: dbRecord.consultant_notes,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at,
  };
}

/**
 * Formatera datum relativt
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Nyss';
  if (diffMins < 60) return `${diffMins} min sedan`;
  if (diffHours < 24) return `${diffHours} tim sedan`;
  if (diffDays < 7) return `${diffDays} dagar sedan`;
  return date.toLocaleDateString('sv-SE');
}

/**
 * Hämta status-etikett på svenska
 */
export function getStatusLabel(status: SharedJob['status']): string {
  const labels: Record<string, string> = {
    pending: 'Väntar på granskning',
    reviewed: 'Granskad',
    approved: 'Godkänd',
    rejected: 'Ej lämplig',
  };
  return labels[status] || status;
}

/**
 * Hämta status-färg
 */
export function getStatusColor(status: SharedJob['status']): string {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    reviewed: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
