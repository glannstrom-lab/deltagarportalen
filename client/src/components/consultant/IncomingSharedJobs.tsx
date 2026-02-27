/**
 * Incoming Shared Jobs
 * Vy för konsulenter att se jobb som delats av deltagare
 */

import React, { useState, useEffect } from 'react';
import { Inbox, CheckCircle, XCircle, Eye, MessageSquare, ExternalLink, X } from 'lucide-react';
import {
  getIncomingSharedJobs,
  updateSharedJobStatus,
  SharedJob,
  formatRelativeTime,
  getStatusLabel,
  getStatusColor,
  getSharedJobsStats,
} from '@/services/jobSharingService';
import { SkeletonList } from '@/components/ui/LoadingState';

interface IncomingSharedJobsProps {
  consultantId: string;
}

export const IncomingSharedJobs: React.FC<IncomingSharedJobsProps> = ({
  consultantId,
}) => {
  const [jobs, setJobs] = useState<SharedJob[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    approved: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<SharedJob | null>(null);
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [consultantId]);

  const fetchData = async () => {
    setIsLoading(true);
    const [jobsData, statsData] = await Promise.all([
      getIncomingSharedJobs(consultantId),
      getSharedJobsStats(consultantId),
    ]);
    setJobs(jobsData);
    setStats(statsData);
    setIsLoading(false);
  };

  const handleStatusUpdate = async (status: SharedJob['status']) => {
    if (!selectedJob) return;

    setIsUpdating(true);
    const result = await updateSharedJobStatus(selectedJob.id, status, notes);
    
    if (result.success) {
      setSelectedJob(null);
      setNotes('');
      await fetchData();
    }
    setIsUpdating(false);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Inbox className="w-6 h-6 text-primary-600" />
          Inkomna jobbförslag
        </h2>
        <SkeletonList rows={3} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {/* Header med stats */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Inbox className="w-6 h-6 text-primary-600" />
          Inkomna jobbförslag
          {stats.pending > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {stats.pending}
            </span>
          )}
        </h2>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-xs text-amber-700">Väntar</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.reviewed}</p>
            <p className="text-xs text-blue-700">Granskade</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-xs text-green-700">Godkända</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-xs text-red-700">Ej lämpliga</p>
          </div>
        </div>
      </div>

      {/* Lista över jobb */}
      <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
        {jobs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Inbox className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Inga delade jobb ännu</p>
            <p className="text-sm mt-1">Dina deltagare kan dela intressanta jobb med dig</p>
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                selectedJob?.id === job.id ? 'bg-primary-50' : ''
              }`}
              onClick={() => setSelectedJob(job)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {job.jobData.headline}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(job.status)}`}>
                      {getStatusLabel(job.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{job.jobData.employer?.name}</p>
                  
                  {job.message && (
                    <div className="mt-2 flex items-start gap-2 text-sm text-gray-700 bg-gray-100 rounded-lg p-2">
                      <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="italic">"{job.message}"</p>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-2">
                    Delat {formatRelativeTime(job.createdAt)}
                  </p>
                </div>

                <button className="text-gray-400 hover:text-primary-600">
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail view modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Granska jobb</h3>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Jobb-info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">
                  {selectedJob.jobData.headline}
                </h4>
                <p className="text-gray-600">{selectedJob.jobData.employer?.name}</p>
                {selectedJob.jobData.workplace_address && (
                  <p className="text-gray-500 text-sm mt-1">
                    {selectedJob.jobData.workplace_address.municipality},{' '}
                    {selectedJob.jobData.workplace_address.region}
                  </p>
                )}
                
                {/* Länk till annons */}
                {selectedJob.jobData.application_details?.url && (
                  <a
                    href={selectedJob.jobData.application_details.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm mt-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visa annons
                  </a>
                )}
              </div>

              {/* Deltagarens meddelande */}
              {selectedJob.message && (
                <div className="bg-primary-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 italic">
                    "{selectedJob.message}"
                  </p>
                  <p className="text-xs text-gray-500 mt-1">- Deltagaren</p>
                </div>
              )}

              {/* Status-åtgärder */}
              {selectedJob.status === 'pending' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Anteckningar till deltagaren
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="T.ex. 'Detta ser intressant ut! Låt oss diskutera det på vårt nästa möte.'"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleStatusUpdate('approved')}
                      disabled={isUpdating}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Godkänn
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('rejected')}
                      disabled={isUpdating}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Ej lämplig
                    </button>
                  </div>
                </>
              )}

              {/* Tidigare beslut */}
              {selectedJob.status !== 'pending' && selectedJob.consultantNotes && (
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700">Dina anteckningar:</p>
                  <p className="text-sm text-gray-600">{selectedJob.consultantNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomingSharedJobs;
