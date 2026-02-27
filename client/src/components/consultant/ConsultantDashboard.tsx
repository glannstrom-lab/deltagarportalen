/**
 * ConsultantDashboard
 * Huvuddashboard för konsulenter att hantera sina deltagare
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  TrendingUp,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingState } from '@/components/ui/LoadingState';
import { ParticipantList } from './ParticipantList';
import { InviteParticipantDialog } from './InviteParticipantDialog';
import { ConsultantStats } from './ConsultantStats';
import { RecentActivity } from './RecentActivity';

interface Participant {
  participant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'ON_HOLD';
  priority: number;
  has_cv: boolean;
  ats_score: number | null;
  completed_interest_test: boolean;
  holland_code: string | null;
  saved_jobs_count: number;
  notes_count: number;
  last_contact_at: string | null;
  next_meeting_scheduled: string | null;
  last_login: string | null;
}

export const ConsultantDashboard: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedView, setSelectedView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Hämta deltagare via vyn
      const { data, error } = await supabase
        .from('consultant_dashboard_participants')
        .select('*')
        .eq('consultant_id', user.id)
        .order('priority', { ascending: false })
        .order('last_contact_at', { ascending: true });

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredParticipants = participants.filter(p => {
    const matchesSearch = 
      (p.first_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (p.last_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Beräkna statistik
  const stats = {
    total: participants.length,
    active: participants.filter(p => p.status === 'ACTIVE').length,
    needsAttention: participants.filter(p => 
      !p.last_contact_at || 
      new Date(p.last_contact_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length,
    completedCV: participants.filter(p => p.has_cv && (p.ats_score || 0) > 70).length,
  };

  if (loading) {
    return <LoadingState type="dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mina Deltagare</h1>
              <p className="text-gray-500 mt-1">
                Hantera och följ upp {stats.total} deltagare
              </p>
            </div>
            <button
              onClick={() => setShowInviteDialog(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Bjud in deltagare
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <ConsultantStats stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content - Participant List */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Sök efter namn eller email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Alla statusar</option>
                  <option value="ACTIVE">Aktiva</option>
                  <option value="INACTIVE">Inaktiva</option>
                  <option value="ON_HOLD">Pausade</option>
                  <option value="COMPLETED">Avslutade</option>
                </select>

                <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                  <button
                    onClick={() => setSelectedView('grid')}
                    className={`p-2 rounded-lg ${selectedView === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedView('list')}
                    className={`p-2 rounded-lg ${selectedView === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Users className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Participant List */}
            <ParticipantList 
              participants={filteredParticipants}
              view={selectedView}
              onRefresh={fetchParticipants}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Snabbåtgärder</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                  <Mail className="w-5 h-5 text-primary-600" />
                  <span className="text-gray-700">Skicka gruppmeddelande</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  <span className="text-gray-700">Schemalägg möten</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                  <FileText className="w-5 h-5 text-primary-600" />
                  <span className="text-gray-700">Exportera rapport</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <RecentActivity />

            {/* Attention Needed */}
            {stats.needsAttention > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900">Kräver uppmärksamhet</h3>
                    <p className="text-amber-700 text-sm mt-1">
                      {stats.needsAttention} deltagare har inte kontaktats på över 7 dagar.
                    </p>
                    <button className="text-amber-800 text-sm font-medium mt-3 hover:underline">
                      Visa lista →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Dialog */}
      {showInviteDialog && (
        <InviteParticipantDialog 
          onClose={() => setShowInviteDialog(false)}
          onSuccess={fetchParticipants}
        />
      )}
    </div>
  );
};

export default ConsultantDashboard;
