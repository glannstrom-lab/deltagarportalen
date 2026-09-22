/**
 * SuperAdminPanel
 * Administrationspanel för superadmins
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  BarChart3,
  Search,
  CheckCircle,
  XCircle,
  Building2
} from '@/components/ui/icons';
import { supabase } from '@/lib/supabase';
import { arTestkonto } from '@/lib/testkonton';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { OrganisationerTab } from './OrganisationerTab';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'CONSULTANT' | 'USER';
  status: string;
  created_at: string;
}

/**
 * Rollerna en roll för med sig — samma form som superadmin-kontot i prod
 * ({USER,CONSULTANT,ADMIN,SUPERADMIN}). Behörigheten läses ur `roles ∪ {role}`
 * (useUserRoles) och den aktiva rollen ur `active_role || role`, så ett byte
 * som bara skriver `role` sänker ingen: en konsulent med roles={CONSULTANT}
 * behöll konsulentvyn efter att ha satts till Deltagare (städpasset 2026-09-22).
 */
const ROLLER_FOR: Record<User['role'], User['role'][]> = {
  USER: ['USER'],
  CONSULTANT: ['USER', 'CONSULTANT'],
  ADMIN: ['USER', 'CONSULTANT', 'ADMIN'],
  SUPERADMIN: ['USER', 'CONSULTANT', 'ADMIN', 'SUPERADMIN'],
};

export const SuperAdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  // Hämtfel skiljs från en tom lista — annars sa statistiken "0 användare".
  const [hamtFel, setHamtFel] = useState<string | null>(null);
  const [rollFel, setRollFel] = useState<string | null>(null);
  // 'settings'-fliken borttagen 2026-07-10 (B4): var en tom "Kommer snart..."-yta
  const [activeTab, setActiveTab] = useState<'users' | 'stats' | 'organisationer'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  // BL5: testkonton (Playwright, KM-pilot, example.com) är borträknade som
  // default — 91 av 104 AI-anrop och 30 av 31 konsulentrelationer var testtrafik.
  const [doljTestkonton, setDoljTestkonton] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setHamtFel(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      const text = error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : '';
      setHamtFel(text || 'Okänt fel');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    setRollFel(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole, roles: ROLLER_FOR[newRole], active_role: null })
        .eq('id', userId)
        .select('id');

      if (error) throw error;
      // RLS kan släppa igenom en UPDATE som träffar noll rader utan fel.
      if (!data || data.length === 0) throw new Error('Ingen rad uppdaterades');
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error changing role:', error);
      setRollFel('Kunde inte ändra roll. Rollen är oförändrad.');
    }
  };

  const filteredUsers = users.filter(u =>
    (!doljTestkonton || !arTestkonto(u.email)) && (
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.first_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
  );

  // Statistiken räknar ALLTID utan testkonton — kryssrutan gäller bara listan.
  const riktigaAnvandare = users.filter(u => !arTestkonto(u.email));
  const antalTestkonton = users.length - riktigaAnvandare.length;

  if (loading) {
    return <LoadingState fullHeight />;
  }

  if (hamtFel) {
    return (
      <ErrorState
        title="Användarna kunde inte hämtas"
        message={hamtFel}
        onRetry={() => { void fetchUsers(); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Shield className="w-8 h-8 text-primary-400" />
            <div>
              <h1 className="text-2xl font-bold">Superadmin</h1>
              <p className="text-gray-400 text-sm">Systemadministration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {[
              { id: 'users', label: 'Användare', icon: Users },
              { id: 'stats', label: 'Statistik', icon: BarChart3 },
              { id: 'organisationer', label: 'Organisationer', icon: Building2 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'users' | 'stats' | 'organisationer')}
                className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Sök användare..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={doljTestkonton}
                    onChange={(e) => setDoljTestkonton(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Dölj testkonton
                </label>
                {/* "Bjud in konsulent" borttagen 2026-09-22: knappen saknade onClick. */}
              </div>
            </div>

            {rollFel && (
              <p role="alert" className="p-3 rounded-lg bg-red-50 text-red-800 text-sm border border-red-200">
                {rollFel}
              </p>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Användare
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Roll
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              <span>{user.first_name} {user.last_name}</span>
                              {arTestkonto(user.email) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  Testkonto
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as User['role'])}
                          className="text-sm border border-gray-300 rounded-lg px-3 py-1"
                        >
                          <option value="USER">Deltagare</option>
                          <option value="CONSULTANT">Konsulent</option>
                          <option value="ADMIN">Admin</option>
                          <option value="SUPERADMIN">Superadmin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status === 'ACTIVE' ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Totalt antal användare</p>
                <p className="text-3xl font-bold text-gray-900">{riktigaAnvandare.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Konsulenter</p>
                <p className="text-3xl font-bold text-gray-900">
                  {riktigaAnvandare.filter(u => u.role === 'CONSULTANT').length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Deltagare</p>
                <p className="text-3xl font-bold text-gray-900">
                  {riktigaAnvandare.filter(u => u.role === 'USER').length}
                </p>
              </div>
            </div>
            {/* BL5: talen ovan är utan testtrafik. Raden här visar var resten tog vägen. */}
            <p className="text-sm text-gray-500">
              Testkonton (borträknade): {antalTestkonton}
            </p>
          </div>
        )}

        {activeTab === 'organisationer' && (
          <OrganisationerTab users={users} />
        )}

      </div>
    </div>
  );
};

export default SuperAdminPanel;
