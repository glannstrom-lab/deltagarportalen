/**
 * Daily Job Tab - Ett Jobb Om Dagen
 * Feature #2: Presentera ETT noggrant utvalt jobb per dag
 * Minskar överväldigande för användare som behöver ta det lugnt
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Star,
  RefreshCw,
  Heart,
  FileText,
  ExternalLink,
  Building2,
  MapPin,
  Calendar,
  Sparkles,
  ChevronRight,
  Clock,
  CheckCircle,
  Send,
} from '@/components/ui/icons';
import { Card, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { searchJobs, type PlatsbankenJob } from '@/services/arbetsformedlingenApi';
import { useSavedJobs } from '@/hooks/useSavedJobs';

// Storage key for daily job
const DAILY_JOB_KEY = 'jobin_daily_job';
const DAILY_JOB_DATE_KEY = 'jobin_daily_job_date';

interface DailyJobData {
  job: PlatsbankenJob;
  reason: string;
  matchScore: number;
}

export function DailyJobTab() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { saveJob, isSaved, removeJob } = useSavedJobs();

  const [isLoading, setIsLoading] = useState(true);
  const [dailyJob, setDailyJob] = useState<DailyJobData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [hasActioned, setHasActioned] = useState(false);

  // Get today's date string
  const getTodayKey = () => new Date().toISOString().split('T')[0];

  // Load or generate daily job
  useEffect(() => {
    const loadDailyJob = async () => {
      setIsLoading(true);

      try {
        // Check if we have today's job cached
        const cachedDate = localStorage.getItem(DAILY_JOB_DATE_KEY);
        const cachedJob = localStorage.getItem(DAILY_JOB_KEY);

        if (cachedDate === getTodayKey() && cachedJob) {
          setDailyJob(JSON.parse(cachedJob));
          setIsLoading(false);
          return;
        }

        // Fetch fresh jobs
        const result = await searchJobs({ limit: 50, publishedWithin: 'week' });

        if (result.hits.length === 0) {
          setDailyJob(null);
          setIsLoading(false);
          return;
        }

        // Select best job based on criteria
        const selectedJob = selectBestJob(result.hits);

        // Cache for today
        localStorage.setItem(DAILY_JOB_DATE_KEY, getTodayKey());
        localStorage.setItem(DAILY_JOB_KEY, JSON.stringify(selectedJob));

        setDailyJob(selectedJob);
      } catch (error) {
        console.error('Failed to load daily job:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDailyJob();
  }, []);

  // Select the best job based on various criteria
  const selectBestJob = (jobs: PlatsbankenJob[]): DailyJobData => {
    // Scoring factors:
    // - Recent publication (higher score)
    // - Has complete information
    // - Has application URL
    // - Good employer name
    // - Not too long description (digestible)

    const scoredJobs = jobs.map((job) => {
      let score = 0;
      let reasons: string[] = [];

      // Recent publication
      const daysOld = Math.floor(
        (Date.now() - new Date(job.publication_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysOld <= 1) {
        score += 30;
        reasons.push(lang === 'en' ? 'Just published' : 'Nyligen publicerad');
      } else if (daysOld <= 3) {
        score += 20;
        reasons.push(lang === 'en' ? 'New this week' : 'Ny denna vecka');
      }

      // Has complete information
      if (job.employer?.name) score += 15;
      if (job.workplace_address?.municipality) {
        score += 10;
        reasons.push(lang === 'en' ? 'Clear location' : 'Tydlig plats');
      }
      if (job.description?.text && job.description.text.length > 200) score += 10;

      // Has application URL
      if (job.application_details?.url) {
        score += 20;
        reasons.push(lang === 'en' ? 'Easy to apply' : 'Enkel att ansöka till');
      }

      // Not too overwhelming (description not too long)
      if (job.description?.text && job.description.text.length < 3000) {
        score += 10;
        reasons.push(lang === 'en' ? 'Manageable scope' : 'Hanterbar omfattning');
      }

      // Employment type bonus
      if (job.employment_type?.label?.toLowerCase().includes('heltid')) {
        score += 5;
      }

      return { job, score, reasons };
    });

    // Sort by score and pick top
    scoredJobs.sort((a, b) => b.score - a.score);
    const best = scoredJobs[0];

    return {
      job: best.job,
      reason: best.reasons.slice(0, 2).join(' • '),
      matchScore: Math.min(Math.round((best.score / 100) * 100), 95),
    };
  };

  // Handle refresh (get new job)
  const handleRefresh = () => {
    localStorage.removeItem(DAILY_JOB_KEY);
    localStorage.removeItem(DAILY_JOB_DATE_KEY);
    setDailyJob(null);
    setShowDetails(false);
    setHasActioned(false);
    // Reload will trigger useEffect
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16" role="status">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
          <Star className="w-8 h-8 text-white" />
        </div>
        <p className="text-stone-600 dark:text-stone-400">
          {lang === 'en' ? 'Finding your job of the day...' : 'Hittar dagens jobb åt dig...'}
        </p>
      </div>
    );
  }

  if (!dailyJob) {
    return (
      <Card className="p-8 text-center">
        <Star className="w-12 h-12 text-stone-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">
          {lang === 'en' ? 'No job for today' : 'Inget jobb för idag'}
        </h3>
        <p className="text-stone-600 dark:text-stone-400 mb-4">
          {lang === 'en'
            ? 'Try refreshing or come back tomorrow.'
            : 'Försök uppdatera eller kom tillbaka imorgon.'}
        </p>
        <Button onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {lang === 'en' ? 'Refresh' : 'Uppdatera'}
        </Button>
      </Card>
    );
  }

  const { job, reason, matchScore } = dailyJob;
  const jobIsSaved = isSaved(job.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header card */}
      <Card className="p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-rose-900/20 border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200 dark:shadow-amber-900/30">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">
              {lang === 'en' ? "Today's Job For You" : 'Dagens jobb för dig'}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString(lang === 'en' ? 'en-SE' : 'sv-SE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {matchScore}%
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400">
              {lang === 'en' ? 'match' : 'matchning'}
            </div>
          </div>
        </div>

        <p className="text-sm text-stone-600 dark:text-stone-400 bg-white/50 dark:bg-stone-900/30 rounded-lg p-3">
          <Sparkles className="w-4 h-4 inline mr-1 text-amber-500" />
          {lang === 'en'
            ? 'Focus on one opportunity at a time. No pressure, no overwhelm.'
            : 'Fokusera på en möjlighet i taget. Ingen press, ingen stress.'}
        </p>
      </Card>

      {/* The job card */}
      <Card className="overflow-hidden">
        {/* Job header */}
        <div className="p-6 border-b border-stone-100 dark:border-stone-700">
          <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">
            {job.headline}
          </h3>

          <div className="flex flex-wrap gap-3 text-sm text-stone-600 dark:text-stone-400">
            {job.employer?.name && (
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {job.employer.name}
              </span>
            )}
            {job.workplace_address?.municipality && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.workplace_address.municipality}
              </span>
            )}
          </div>

          {/* Why this job */}
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full font-medium">
              {reason}
            </span>
          </div>
        </div>

        {/* Expandable description */}
        <div className="p-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-left"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                {lang === 'en' ? 'About this job' : 'Om jobbet'}
              </span>
              <ChevronRight
                className={cn(
                  'w-5 h-5 text-stone-400 transition-transform',
                  showDetails && 'rotate-90'
                )}
              />
            </div>

            {!showDetails && job.description?.text && (
              <p className="mt-2 text-stone-600 dark:text-stone-400 text-sm line-clamp-3">
                {job.description.text.substring(0, 200)}...
              </p>
            )}
          </button>

          {showDetails && job.description?.text && (
            <div className="mt-4 text-stone-600 dark:text-stone-400 text-sm whitespace-pre-line">
              {job.description.text.substring(0, 1500)}
              {job.description.text.length > 1500 && '...'}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 bg-stone-50 dark:bg-stone-800 border-t border-stone-100 dark:border-stone-700">
          {!hasActioned ? (
            <div className="space-y-3">
              <p className="text-sm text-stone-600 dark:text-stone-400 text-center mb-4">
                {lang === 'en'
                  ? 'What would you like to do with this job?'
                  : 'Vad vill du göra med detta jobb?'}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    if (jobIsSaved) {
                      removeJob(job.id);
                    } else {
                      saveJob(job);
                    }
                    setHasActioned(true);
                  }}
                  className={cn(
                    'flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors',
                    jobIsSaved
                      ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                      : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                  )}
                >
                  <Heart className={cn('w-5 h-5', jobIsSaved && 'fill-current')} />
                  {jobIsSaved
                    ? lang === 'en'
                      ? 'Saved!'
                      : 'Sparad!'
                    : lang === 'en'
                    ? 'Save for later'
                    : 'Spara till senare'}
                </button>

                <Link
                  to={`/cover-letter?jobId=${job.id}&company=${encodeURIComponent(
                    job.employer?.name || ''
                  )}&title=${encodeURIComponent(job.headline)}&desc=${encodeURIComponent(
                    job.description?.text?.substring(0, 500) || ''
                  )}`}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  {lang === 'en' ? 'Write letter' : 'Skriv brev'}
                </Link>
              </div>

              {job.application_details?.url && (
                <a
                  href={job.application_details.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setHasActioned(true)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-medium hover:from-teal-600 hover:to-emerald-600 transition-colors shadow-lg shadow-teal-200 dark:shadow-teal-900/30"
                >
                  <Send className="w-5 h-5" />
                  {lang === 'en' ? 'Apply Now' : 'Ansök nu'}
                </a>
              )}

              <button
                onClick={handleRefresh}
                className="w-full text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 py-2"
              >
                {lang === 'en' ? 'Not interested? Show another job' : 'Inte intresserad? Visa ett annat jobb'}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h4 className="font-semibold text-stone-800 dark:text-stone-100 mb-1">
                {lang === 'en' ? 'Great job!' : 'Bra jobbat!'}
              </h4>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
                {lang === 'en'
                  ? "You've taken action on today's job. Come back tomorrow for a new opportunity!"
                  : 'Du har tagit action på dagens jobb. Kom tillbaka imorgon för en ny möjlighet!'}
              </p>
              <Button variant="outline" onClick={handleRefresh} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                {lang === 'en' ? 'See another job' : 'Visa ett annat jobb'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Tip card */}
      <Card className="p-4 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-stone-700 dark:text-stone-300">
              <strong>{lang === 'en' ? 'Tip:' : 'Tips:'}</strong>{' '}
              {lang === 'en'
                ? 'Take your time with this job. Read it carefully, save it if interesting, or apply when you feel ready.'
                : 'Ta dig tid med detta jobb. Läs det noga, spara om det är intressant, eller ansök när du känner dig redo.'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default DailyJobTab;
