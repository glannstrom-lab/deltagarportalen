/**
 * Mock Interview Session
 * Interaktiv mock-intervju med feedback
 */

import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, RotateCcw, X, CheckCircle, AlertCircle } from 'lucide-react';
import {
  MOCK_INTERVIEWS,
  analyzeStarAnswer,
  saveInterviewSession,
} from '@/services/interviewService';
import type { InterviewQuestion } from '@/services/interviewService';

interface MockInterviewSessionProps {
  interviewId: string;
  onComplete: () => void;
  onExit: () => void;
}

export const MockInterviewSession: React.FC<MockInterviewSessionProps> = ({
  interviewId,
  onComplete,
  onExit,
}) => {
  const interview = MOCK_INTERVIEWS.find(i => i.id === interviewId);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [notes, setNotes] = useState('');
  const [confidence, setConfidence] = useState(3);
  const [showFeedback, setShowFeedback] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState<Array<{
    questionId: string;
    notes: string;
    confidence: number;
  }>>([]);

  if (!interview) return null;

  const currentQuestion = interview.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === interview.questions.length - 1;

  const handleNext = () => {
    // Spara svar
    const answer = {
      questionId: currentQuestion.id,
      notes,
      confidence,
    };

    const newAnswers = [...sessionAnswers, answer];
    setSessionAnswers(newAnswers);

    if (isLastQuestion) {
      // Spara session
      saveInterviewSession({
        mockInterviewId: interviewId,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        answers: newAnswers,
        completed: true,
      });
      onComplete();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setNotes('');
      setConfidence(3);
      setShowFeedback(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const prevAnswer = sessionAnswers[currentQuestionIndex - 1];
      if (prevAnswer) {
        setNotes(prevAnswer.notes);
        setConfidence(prevAnswer.confidence);
      }
    }
  };

  const analysis = showFeedback ? analyzeStarAnswer(notes) : null;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{interview.title}</h2>
          <p className="text-primary-100 text-sm">
            Fråga {currentQuestionIndex + 1} av {interview.questions.length}
          </p>
        </div>
        <button
          onClick={onExit}
          className="text-primary-100 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200">
        <div
          className="h-full bg-primary-500 transition-all"
          style={{ width: `${((currentQuestionIndex + 1) / interview.questions.length) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Question */}
        <div className="bg-primary-50 rounded-lg p-4">
          <p className="text-sm text-primary-600 font-medium mb-1">
            {currentQuestion.category === 'behavioral' && 'Betéende-fråga'}
            {currentQuestion.category === 'technical' && 'Teknisk fråga'}
            {currentQuestion.category === 'situational' && 'Situations-fråga'}
            {currentQuestion.category === 'motivation' && 'Motivations-fråga'}
            {currentQuestion.category === 'strengths' && 'Styrkor & Svagheter'}
          </p>
          <p className="text-lg font-medium text-gray-900">
            {currentQuestion.question}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Syfte: {currentQuestion.purpose}
          </p>
        </div>

        {/* Tips */}
        {!showFeedback && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Tips för denna fråga
            </h4>
            <ul className="space-y-1">
              {currentQuestion.tips.map((tip, i) => (
                <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Answer area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ditt svar (skriv nyckelord för att öva)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Skriv ditt svar här för att få feedback..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            rows={5}
          />
        </div>

        {/* Confidence rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hur säker känner du dig på detta svar? (1-5)
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => setConfidence(rating)}
                className={`
                  w-10 h-10 rounded-lg font-semibold transition-colors
                  ${confidence === rating
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {rating}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback */}
        {showFeedback && analysis && (
          <div className={`
            rounded-lg p-4
            ${analysis.score >= 75 ? 'bg-green-50 border border-green-200' : ''}
            ${analysis.score >= 50 && analysis.score < 75 ? 'bg-amber-50 border border-amber-200' : ''}
            ${analysis.score < 50 ? 'bg-red-50 border border-red-200' : ''}
          `}>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Feedback (Poäng: {analysis.score}/100)
            </h4>
            
            {analysis.feedback.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700">Bra:</p>
                <ul className="text-sm space-y-1">
                  {analysis.feedback.map((f, i) => (
                    <li key={i} className="text-green-700">{f}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysis.missing.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700">Att förbättra:</p>
                <ul className="text-sm space-y-1">
                  {analysis.missing.map((m, i) => (
                    <li key={i} className="text-red-600">• {m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* STAR guide */}
        {currentQuestion.starFormat && !showFeedback && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Kom ihåg STAR-metoden:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-white rounded">
                <span className="font-semibold text-primary-600">S</span>ituation: {currentQuestion.starFormat.situation}
              </div>
              <div className="p-2 bg-white rounded">
                <span className="font-semibold text-primary-600">T</span>ask: {currentQuestion.starFormat.task}
              </div>
              <div className="p-2 bg-white rounded">
                <span className="font-semibold text-primary-600">A</span>ction: {currentQuestion.starFormat.action}
              </div>
              <div className="p-2 bg-white rounded">
                <span className="font-semibold text-primary-600">R</span>esult: {currentQuestion.starFormat.result}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Föregående
          </button>

          {!showFeedback ? (
            <button
              onClick={() => setShowFeedback(true)}
              disabled={notes.length < 10}
              className="flex-1 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Få feedback
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
            >
              {isLastQuestion ? 'Avsluta' : 'Nästa fråga'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MockInterviewSession;
