import { useState, useEffect } from 'react'
import { 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  Target, 
  ArrowRight,
  Loader2,
  Clock,
  Coins,
  TrendingUp,
  Award,
  Building2,
} from 'lucide-react'
import { afApi, type CareerPath as CareerPathType } from '@/services/arbetsformedlingenApi'
import { Link } from 'react-router-dom'

interface CareerPathProps {
  occupationLabel: string
  riasecProfile?: {
    social?: number
    investigative?: number
    realistic?: number
    artistic?: number
    enterprising?: number
    conventional?: number
  }
}

export default function CareerPath({ occupationLabel, riasecProfile }: CareerPathProps) {
  const [careerPath, setCareerPath] = useState<CareerPathType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedStep, setExpandedStep] = useState<number | null>(0)

  useEffect(() => {
    loadCareerPath()
  }, [occupationLabel])

  const loadCareerPath = async () => {
    try {
      setLoading(true)
      const path = await afApi.getCareerPath(occupationLabel)
      setCareerPath(path)
    } catch (err) {
      console.error('Career path error:', err)
      setError('Kunde inte ladda karriärvägen')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center">
        <Loader2 size={48} className="mx-auto text-teal-600 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-slate-800">Bygger din karriärväg...</h3>
        <p className="text-slate-500">Vi söker utbildningar och jobb</p>
      </div>
    )
  }

  if (error || !careerPath) {
    return (
      <div className="bg-slate-50 rounded-2xl p-8 text-center">
        <p className="text-slate-600">Karriärvägen kunde inte laddas</p>
      </div>
    )
  }

  const steps = [
    {
      id: 0,
      title: 'Din profil',
      icon: Target,
      color: 'bg-purple-100 text-purple-700',
      content: (
        <div className="space-y-4">
          <p className="text-slate-700">
            Baserat på din intresseguide är <strong>{careerPath.occupation}</strong> ett yrke som passar din profil.
          </p>
          {riasecProfile && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h5 className="font-medium text-purple-800 mb-2">Dina starka sidor:</h5>
              <div className="flex flex-wrap gap-2">
                {riasecProfile.social && riasecProfile.social > 70 && (
                  <span className="px-2 py-1 bg-white text-purple-700 rounded text-sm">Social</span>
                )}
                {riasecProfile.investigative && riasecProfile.investigative > 70 && (
                  <span className="px-2 py-1 bg-white text-purple-700 rounded text-sm">Analytisk</span>
                )}
                {riasecProfile.realistic && riasecProfile.realistic > 70 && (
                  <span className="px-2 py-1 bg-white text-purple-700 rounded text-sm">Praktisk</span>
                )}
                {riasecProfile.artistic && riasecProfile.artistic > 70 && (
                  <span className="px-2 py-1 bg-white text-purple-700 rounded text-sm">Kreativ</span>
                )}
                {riasecProfile.enterprising && riasecProfile.enterprising > 70 && (
                  <span className="px-2 py-1 bg-white text-purple-700 rounded text-sm">Drivande</span>
                )}
                {riasecProfile.conventional && riasecProfile.conventional > 70 && (
                  <span className="px-2 py-1 bg-white text-purple-700 rounded text-sm">Strukturerad</span>
                )}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 1,
      title: 'Kompetenser att utveckla',
      icon: Award,
      color: 'bg-amber-100 text-amber-700',
      content: (
        <div className="space-y-4">
          <p className="text-slate-700">
            För att arbeta som <strong>{careerPath.occupation}</strong> behöver du utveckla dessa kompetenser:
          </p>
          <div className="flex flex-wrap gap-2">
            {careerPath.required_competencies.slice(0, 8).map((comp, i) => (
              <span key={i} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                {comp}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Utbildningsvägar',
      icon: GraduationCap,
      color: 'bg-blue-100 text-blue-700',
      content: (
        <div className="space-y-4">
          {careerPath.education_options.length > 0 ? (
            <>
              <p className="text-slate-700">
                Här är utbildningar som leder till yrket:
              </p>
              <div className="space-y-3">
                {careerPath.education_options.slice(0, 3).map((edu, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-semibold text-slate-800">{edu.title}</h5>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {edu.education_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {edu.duration_months} månader
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 size={14} />
                        {edu.provider}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>God nyhet!</strong> Många jobb som {careerPath.occupation} kräver ingen formell utbildning. 
                Arbetsgivare värdesätter ofta erfarenhet och personliga egenskaper högt.
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 3,
      title: 'Tillgängliga jobb',
      icon: Briefcase,
      color: 'bg-green-100 text-green-700',
      content: (
        <div className="space-y-4">
          <p className="text-slate-700">
            Just nu finns det <strong>{careerPath.entry_level_jobs.length}</strong> lediga jobb som matchar din profil:
          </p>
          
          <div className="space-y-3">
            {careerPath.entry_level_jobs.map((job, i) => (
              <Link
                key={i}
                to={`/jobs?search=${encodeURIComponent(job.headline)}`}
                className="block bg-white border border-slate-200 rounded-lg p-4 hover:border-green-400 hover:shadow-md transition-all"
              >
                <h5 className="font-semibold text-slate-800 mb-1">{job.headline}</h5>
                {job.employer?.name && (
                  <p className="text-sm text-slate-500 mb-2">{job.employer.name}</p>
                )}
              </Link>
            ))}
          </div>

          <Link
            to={`/jobs?search=${encodeURIComponent(careerPath.occupation)}`}
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Se alla lediga jobb
            <ArrowRight size={18} />
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 p-6 text-white">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <MapPin size={24} />
          Din karriärväg
        </h3>
        <p className="text-white/80">
          Så här kommer du till ditt drömjobb som {careerPath.occupation}
        </p>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-14 w-0.5 h-8 bg-slate-200" />
              )}

              <button
                onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl transition-colors hover:bg-slate-50"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${step.color}`}>
                  <step.icon size={24} />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-xs font-medium text-slate-500 uppercase">Steg {index + 1}</span>
                  <h4 className="font-semibold text-slate-800">{step.title}</h4>
                </div>
                <ArrowRight
                  size={20}
                  className={`text-slate-400 transition-transform ${
                    expandedStep === step.id ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {expandedStep === step.id && (
                <div className="ml-16 mt-2 mb-4 p-4 bg-slate-50 rounded-xl">
                  {step.content}
                </div>
              )}
            </div>
          ))}
        </div>

        {careerPath.salary_range && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-teal-600" />
              Marknadsinformation
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <Coins size={16} className="text-slate-600 mb-1" />
                <p className="text-2xl font-bold text-slate-800">
                  {careerPath.salary_range.median.toLocaleString('sv-SE')} kr
                </p>
                <p className="text-xs text-slate-500">Uppskattad medianlön</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <TrendingUp size={16} className="text-slate-600 mb-1" />
                <p className={`text-lg font-bold ${
                  careerPath.demand_trend === 'increasing' ? 'text-green-600' :
                  careerPath.demand_trend === 'decreasing' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {careerPath.demand_trend === 'increasing' ? 'Stark efterfrågan' :
                   careerPath.demand_trend === 'stable' ? 'Stabil efterfrågan' :
                   'Sjunkande efterfrågan'}
                </p>
                <p className="text-xs text-slate-500">Marknadstrend</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
