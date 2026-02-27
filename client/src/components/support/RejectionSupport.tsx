/**
 * RejectionSupport
 * Stöd och uppmuntran när användaren får avslag på jobbansökan
 */

import React, { useState } from 'react';
import { Heart, MessageCircle, Lightbulb, Users, ArrowRight, X } from 'lucide-react';

interface SupportMessage {
  category: string;
  title: string;
  message: string;
}

interface RejectionSupportProps {
  jobTitle: string;
  onClose: () => void;
}

export const RejectionSupport: React.FC<RejectionSupportProps> = ({
  jobTitle,
  onClose,
}) => {
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);

  const supportMessages: SupportMessage[] = [
    {
      category: 'EMPATHY',
      title: 'Det är inte personligt',
      message: `Att få avslag på "${jobTitle}" kan kännas tufft, men kom ihåg: Det är inte en reflektion av ditt värde som människa.`,
    },
    {
      category: 'MOTIVATION',
      title: 'Varje nej är ett steg närmare ja',
      message: `Statistiskt sett behöver man söka 10-20 jobb för att få ett ja. Detta nej betyder att du är ett steg närmare rätt jobb!`,
    },
    {
      category: 'ACTION',
      title: 'Prata med din konsulent',
      message: `Vill du gå igenom din ansökan till "${jobTitle}"? Tillsammans kan vi se vad du kan justera inför nästa ansökan.`,
    },
    {
      category: 'PERSPECTIVE',
      title: 'Marknaden är tuff just nu',
      message: 'Arbetsmarknaden är utmanande för många just nu. Det betyder inte att du inte är kompetent!',
    },
  ];

  if (selectedMessage) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-pink-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{selectedMessage.title}</h2>
          </div>

          <p className="text-gray-600 mb-6 leading-relaxed">
            {selectedMessage.message}
          </p>

          <button
            onClick={onClose}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
          >
            Tack, jag förstår
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Vi förstår</h2>
              <p className="text-sm text-gray-500">Avslag är aldrig roliga</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Du fick tyvärr avslag på <strong>{jobTitle}</strong>. 
          Vad skulle hjälpa dig mest just nu?
        </p>

        <div className="space-y-3">
          {supportMessages.map((msg, index) => {
            const icons: Record<string, React.ReactNode> = {
              EMPATHY: <Heart className="w-5 h-5" />,
              MOTIVATION: <Lightbulb className="w-5 h-5" />,
              ACTION: <Users className="w-5 h-5" />,
              PERSPECTIVE: <MessageCircle className="w-5 h-5" />,
            };

            return (
              <button
                key={index}
                onClick={() => setSelectedMessage(msg)}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-primary-50 rounded-lg transition-colors text-left"
              >
                <div className="text-primary-600">{icons[msg.category]}</div>
                <span className="font-medium text-gray-900 flex-1">{msg.title}</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
