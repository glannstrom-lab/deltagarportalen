/**
 * STAR Method Guide
 * Guide för att använda STAR-metoden i intervjuer
 */

import React from 'react';
import { Star, CheckCircle, Lightbulb } from 'lucide-react';

export const StarMethodGuide: React.FC = () => {
  const examples = [
    {
      situation: 'Förra hösten hade vi en stor kund som var missnöjd med leveransen.',
      task: 'Som projektledare var det mitt ansvar att vända situationen och rädda relationen.',
      action: 'Jag bokade ett möte med kunden, lyssnade på deras bekymmer, och satte ihop ett team för att snabbt åtgärda problemen. Jag koordinerade arbetet och höll kunden informerad varje dag.',
      result: 'Inom två veckor hade vi levererat en lösning som överträffade kundens förväntningar. Kunden förnyade kontraktet och ökade sin beställning med 30%.',
    },
  ];

  const mistakes = [
    'Att vara för generell och inte ge specifika exempel',
    'Att använda "vi" istället för "jag" - intervjuaren vill veta vad DU gjorde',
    'Att glömma resultatet - alltid avsluta med vad som hände',
    'Att prata för länge - håll det koncist (2-3 minuter)',
    'Att välja ett exempel där du misslyckades utan att visa lärdomar',
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">STAR-metoden</h2>
        <p className="text-gray-600 mt-2">
          En beprövad metod för att strukturera svar på betéende-baserade frågor
        </p>
      </div>

      {/* STAR breakdown */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-red-50 rounded-xl p-4 border-2 border-red-100">
          <div className="w-10 h-10 bg-red-500 text-white rounded-lg flex items-center justify-center text-xl font-bold mb-3">
            S
          </div>
          <h3 className="font-bold text-red-900 mb-2">Situation</h3>
          <p className="text-sm text-red-800">
            Beskriv situationen kort och koncist. Ge tillräckligt med kontext för att förstå scenariot.
          </p>
          <p className="text-xs text-red-600 mt-2 italic">
            "När jag jobbade på X, hände Y..."
          </p>
        </div>

        <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-100">
          <div className="w-10 h-10 bg-amber-500 text-white rounded-lg flex items-center justify-center text-xl font-bold mb-3">
            T
          </div>
          <h3 className="font-bold text-amber-900 mb-2">Task</h3>
          <p className="text-sm text-amber-800">
            Förklara ditt ansvar och vad som förväntades av dig i denna situation.
          </p>
          <p className="text-xs text-amber-600 mt-2 italic">
            "Mitt ansvar var att..." / "Jag behövde..."
          </p>
        </div>

        <div className="bg-green-50 rounded-xl p-4 border-2 border-green-100">
          <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center text-xl font-bold mb-3">
            A
          </div>
          <h3 className="font-bold text-green-900 mb-2">Action</h3>
          <p className="text-sm text-green-800">
            Beskriv konkret vad DU gjorde. Använd "jag" istället för "vi".
          </p>
          <p className="text-xs text-green-600 mt-2 italic">
            "Jag bestämde mig för att..." / "Jag tog kontakt med..."
          </p>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-100">
          <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center text-xl font-bold mb-3">
            R
          </div>
          <h3 className="font-bold text-blue-900 mb-2">Result</h3>
          <p className="text-sm text-blue-800">
            Avsluta med resultatet. Kvantifiera när möjligt. Vad lärde du dig?
          </p>
          <p className="text-xs text-blue-600 mt-2 italic">
            "Resultatet blev att..." / "Vi ökade försäljningen med X%"
          </p>
        </div>
      </div>

      {/* Example */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Exempel: "Berätta om en konflikt du hanterade"
        </h3>
        
        <div className="space-y-3">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">S</span>
            <p className="text-gray-700 pt-1">{examples[0].situation}</p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold">T</span>
            <p className="text-gray-700 pt-1">{examples[0].task}</p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">A</span>
            <p className="text-gray-700 pt-1">{examples[0].action}</p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">R</span>
            <p className="text-gray-700 pt-1">{examples[0].result}</p>
          </div>
        </div>
      </div>

      {/* Common mistakes */}
      <div className="bg-red-50 rounded-xl p-6">
        <h3 className="font-bold text-red-900 mb-4">Vanliga misstag att undvika</h3>
        <ul className="space-y-2">
          {mistakes.map((mistake, i) => (
            <li key={i} className="flex items-start gap-2 text-red-800">
              <span className="text-red-500">×</span>
              {mistake}
            </li>
          ))}
        </ul>
      </div>

      {/* Practice tip */}
      <div className="bg-primary-50 rounded-xl p-6 text-center">
        <CheckCircle className="w-12 h-12 text-primary-600 mx-auto mb-3" />
        <h3 className="font-bold text-primary-900 mb-2">Öva gör mästaren!</h3>
        <p className="text-primary-700 mb-4">
          Ju mer du övar på STAR-metoden, desto mer naturligt blir det i en riktig intervju.
        </p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Starta en övning
        </button>
      </div>
    </div>
  );
};

export default StarMethodGuide;
