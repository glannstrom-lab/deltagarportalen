/**
 * Interview Preparation Component
 * Huvudvy för intervjuförberedelse
 */

import React, { useState } from 'react';
import { Mic, BookOpen, Target, TrendingUp, Play, Clock, Award } from 'lucide-react';
import {
  MOCK_INTERVIEWS,
  getInterviewTips,
  calculateProgress,
} from '@/services/interviewService';
import { MockInterviewSession } from './MockInterviewSession';
import { StarMethodGuide } from './StarMethodGuide';

interface InterviewPrepProps {
  jobTitle?: string;
}

export const InterviewPrep: React.FC<InterviewPrepProps> = ({ jobTitle }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'practice' | 'star' | 'tips'>('overview');
  const [selectedInterview, setSelectedInterview] = useState<string | null>(null);
  const progress = calculateProgress();

  if (selectedInterview) {
    return (
      <MockInterviewSession
        interviewId={selectedInterview}
        onComplete={() => setSelectedInterview(null)}
        onExit={() => setSelectedInterview(null)}
      />
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Progress cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Övade intervjuer</span>
          </div>
          <p className="text-3xl font-bold">{progress.totalSessions}</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Medelconfidence</span>
          </div>
          <p className="text-3xl font-bold">
            {progress.averageConfidence > 0 
              ? `${progress.averageConfidence.toFixed(1)}/5`
              : '-'
            }
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Förbättring</span>
          </div>
          <p className="text-3xl font-bold">
            {progress.improvement > 0 
              ? `+${progress.improvement.toFixed(1)}`
              : progress.improvement < 0
                ? progress.improvement.toFixed(1)
                : '-'
            }
          </p>
        </div>
      </div>

      {/* Quick start */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-primary-600" />
          Välj en övning
        </h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          {MOCK_INTERVIEWS.map((interview) => (
            <button
              key={interview.id}
              onClick={() => setSelectedInterview(interview.id)}
              className="text-left p-4 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`
                  text-xs font-semibold px-2 py-1 rounded-full
                  ${interview.difficulty === 'easy' ? 'bg-green-100 text-green-700' : ''}
                  ${interview.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' : ''}
                  ${interview.difficulty === 'hard' ? 'bg-red-100 text-red-700' : ''}
                `}>
                  {interview.difficulty === 'easy' && 'Nybörjare'}
                  {interview.difficulty === 'medium' && 'Medel'}
                  {interview.difficulty === 'hard' && 'Avancerad'}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {interview.duration} min
                </span>
              </div>
              
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 mb-1">
                {interview.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {interview.description}
              </p>
              
              <div className="flex items-center gap-2 text-primary-600 text-sm font-medium">
                <Play className="w-4 h-4" />
                Starta övning
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTips = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-primary-600" />
        Tips inför intervjun
      </h2>
      
      {jobTitle && (
        <div className="bg-primary-50 rounded-lg p-4 mb-6">
          <p className="text-primary-800 font-medium">
            Förberedelse för: {jobTitle}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {getInterviewTips(jobTitle).map((tip, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-semibold">
              {i + 1}
            </span>
            <span className="text-gray-700">{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation tabs */}
      <div className="flex gap-2 bg-white rounded-xl shadow p-1">
        {[
          { id: 'overview', label: 'Översikt', icon: Target },
          { id: 'tips', label: 'Tips', icon: BookOpen },
          { id: 'star', label: 'STAR-metoden', icon: Award },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${activeTab === tab.id 
                ? 'bg-primary-100 text-primary-700' 
                : 'text-gray-600 hover:bg-gray-100'
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'tips' && renderTips()}
      {activeTab === 'star' && <StarMethodGuide />}
    </div>
  );
};

export default InterviewPrep;
