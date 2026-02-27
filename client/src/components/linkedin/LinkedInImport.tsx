/**
 * LinkedIn Import Component
 * Låter användare importera sin LinkedIn-profil
 */

import React, { useState } from 'react';
import { Linkedin, CheckCircle, AlertCircle, User } from 'lucide-react';
import {
  initiateLinkedInAuth,
  getMockLinkedInProfile,
  convertLinkedInToCV,
  isLinkedInIntegrationAvailable,
} from '@/services/linkedinService';
import type { LinkedInProfile } from '@/services/linkedinService';
import { LoadingState } from '@/components/ui/LoadingState';

interface LinkedInImportProps {
  onImport: (cvData: any) => void;
  existingData?: any;
}

export const LinkedInImport: React.FC<LinkedInImportProps> = ({
  onImport,
  existingData,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [previewProfile, setPreviewProfile] = useState<LinkedInProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (isLinkedInIntegrationAvailable()) {
        // Verklig OAuth-flow
        initiateLinkedInAuth();
      } else {
        // Demo-läge - simulera inloggning
        await new Promise(resolve => setTimeout(resolve, 1500));
        const mockProfile = getMockLinkedInProfile();
        setPreviewProfile(mockProfile);
      }
    } catch (err) {
      setError('Kunde inte ansluta till LinkedIn. Försök igen.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleImport = () => {
    if (!previewProfile) return;

    const cvData = convertLinkedInToCV(previewProfile);
    
    // Om det finns befintlig data, slå samman
    if (existingData) {
      onImport({
        ...cvData,
        ...existingData,
        // Kombinera skills utan dubbletter
        skills: [...new Set([...(cvData.skills || []), ...(existingData.skills || [])])],
      });
    } else {
      onImport(cvData);
    }
  };

  const handleCancel = () => {
    setPreviewProfile(null);
    setError(null);
  };

  if (isConnecting) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <LoadingState
          message="Ansluter till LinkedIn..."
          submessage="Detta kan ta några sekunder"
          size="lg"
        />
      </div>
    );
  }

  if (previewProfile) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-[#0077B5] text-white p-4 flex items-center gap-3">
          <Linkedin className="w-8 h-8" />
          <div>
            <h2 className="text-lg font-bold">Förhandsgranska import</h2>
            <p className="text-blue-100 text-sm">
              Granska din LinkedIn-data innan du importerar
            </p>
          </div>
        </div>

        {/* Preview content */}
        <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
          {/* Personal info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {previewProfile.firstName} {previewProfile.lastName}
              </h3>
              <p className="text-gray-600 text-sm">{previewProfile.headline}</p>
              <p className="text-gray-500 text-sm">
                {previewProfile.location?.city}, {previewProfile.location?.country}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-600">
                {previewProfile.experience.length}
              </p>
              <p className="text-xs text-gray-600">Erfarenheter</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-600">
                {previewProfile.education.length}
              </p>
              <p className="text-xs text-gray-600">Utbildningar</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-600">
                {previewProfile.skills.length}
              </p>
              <p className="text-xs text-gray-600">Kompetenser</p>
            </div>
          </div>

          {/* Skills preview */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Kompetenser som importeras:</h4>
            <div className="flex flex-wrap gap-2">
              {previewProfile.skills.slice(0, 10).map((skill, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                >
                  {skill}
                </span>
              ))}
              {previewProfile.skills.length > 10 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  +{previewProfile.skills.length - 10} till
                </span>
              )}
            </div>
          </div>

          {/* Experience preview */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Senaste erfarenhet:</h4>
            {previewProfile.experience.slice(0, 2).map((exp, i) => (
              <div key={i} className="text-sm text-gray-600 mb-2">
                <p className="font-medium text-gray-800">{exp.title}</p>
                <p>{exp.company}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={handleImport}
            className="flex-1 px-4 py-2 bg-[#0077B5] text-white rounded-lg hover:bg-[#005885] transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Importera data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-center space-y-4">
        {/* LinkedIn logo */}
        <div className="w-16 h-16 bg-[#0077B5] rounded-xl flex items-center justify-center mx-auto">
          <Linkedin className="w-10 h-10 text-white" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Importera från LinkedIn
          </h2>
          <p className="text-gray-600 mt-2 max-w-sm mx-auto">
            Slipp skriva in samma information igen. Importera dina erfarenheter, 
            utbildningar och kompetenser direkt från LinkedIn.
          </p>
        </div>

        {/* Benefits */}
        <div className="text-left max-w-sm mx-auto space-y-2 py-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-600">
              Spara tid - informationen fylls i automatiskt
            </span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-600">
              Du kan redigera allt efter import
            </span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-600">
              Din information hanteras säkert
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          onClick={handleConnect}
          className="w-full max-w-sm px-6 py-3 bg-[#0077B5] text-white rounded-lg hover:bg-[#005885] transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Linkedin className="w-5 h-5" />
          {!isLinkedInIntegrationAvailable() 
            ? 'Demo: Visa exempeldata' 
            : 'Anslut LinkedIn-konto'}
        </button>

        {!isLinkedInIntegrationAvailable() && (
          <p className="text-xs text-gray-400">
            LinkedIn-integration är i demoläge. I produktion ansluts ditt riktiga konto.
          </p>
        )}
      </div>
    </div>
  );
};

export default LinkedInImport;
