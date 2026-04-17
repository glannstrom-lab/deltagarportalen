/**
 * Job Map Tab - Geografisk Jobbkarta
 * Feature #1: Visa jobb på karta med pendlingsradie
 * Feature #7: Geografisk Komfortzon - olika radier för "bra dag" vs "tung dag"
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  RefreshCw,
  AlertCircle,
  Briefcase,
  Building2,
  Navigation,
  ZoomIn,
  ZoomOut,
  Locate,
  Car,
  Train,
  Bike,
  Settings,
  Heart,
  ExternalLink,
} from '@/components/ui/icons';
import { Card, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { searchJobs, type PlatsbankenJob } from '@/services/arbetsformedlingenApi';

// Swedish city coordinates for geocoding fallback
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'stockholm': { lat: 59.3293, lng: 18.0686 },
  'göteborg': { lat: 57.7089, lng: 11.9746 },
  'goteborg': { lat: 57.7089, lng: 11.9746 },
  'malmö': { lat: 55.6050, lng: 13.0038 },
  'malmo': { lat: 55.6050, lng: 13.0038 },
  'uppsala': { lat: 59.8586, lng: 17.6389 },
  'linköping': { lat: 58.4108, lng: 15.6214 },
  'västerås': { lat: 59.6099, lng: 16.5448 },
  'örebro': { lat: 59.2753, lng: 15.2134 },
  'helsingborg': { lat: 56.0465, lng: 12.6945 },
  'norrköping': { lat: 58.5877, lng: 16.1924 },
  'jönköping': { lat: 57.7826, lng: 14.1618 },
  'umeå': { lat: 63.8258, lng: 20.2630 },
  'lund': { lat: 55.7047, lng: 13.1910 },
  'borås': { lat: 57.7210, lng: 12.9401 },
  'sundsvall': { lat: 62.3908, lng: 17.3069 },
  'gävle': { lat: 60.6749, lng: 17.1413 },
  'eskilstuna': { lat: 59.3666, lng: 16.5077 },
  'karlstad': { lat: 59.4022, lng: 13.5115 },
  'växjö': { lat: 56.8777, lng: 14.8091 },
  'halmstad': { lat: 56.6745, lng: 12.8578 },
  'östersund': { lat: 63.1792, lng: 14.6357 },
  'luleå': { lat: 65.5848, lng: 22.1547 },
  'trollhättan': { lat: 58.2837, lng: 12.2886 },
  'solna': { lat: 59.3600, lng: 18.0000 },
  'nacka': { lat: 59.3108, lng: 18.1636 },
  'huddinge': { lat: 59.2373, lng: 17.9818 },
  'sollentuna': { lat: 59.4280, lng: 17.9507 },
  'täby': { lat: 59.4439, lng: 18.0687 },
  'kista': { lat: 59.4028, lng: 17.9449 },
  // Default to Stockholm center
  'default': { lat: 59.3293, lng: 18.0686 },
};

// Commute comfort zones
const COMFORT_ZONES = {
  goodDay: { radius: 30, label: 'Bra dag', color: '#10b981' },    // 30 km
  normalDay: { radius: 20, label: 'Normal', color: '#3b82f6' },   // 20 km
  toughDay: { radius: 10, label: 'Tung dag', color: '#f59e0b' },  // 10 km
};

interface JobWithCoords extends PlatsbankenJob {
  coords?: { lat: number; lng: number };
  distance?: number;
}

export function JobMapTab() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobWithCoords[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobWithCoords | null>(null);
  const [homeAddress, setHomeAddress] = useState('');
  const [homeCoords, setHomeCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [commuteMode, setCommuteMode] = useState<'goodDay' | 'normalDay' | 'toughDay'>('normalDay');
  const [showSettings, setShowSettings] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Check if Google Maps API is available
  const isGoogleMapsAvailable = typeof window !== 'undefined' && window.google?.maps;

  // Get coordinates for a location string
  const getCoordinates = useCallback((location: string): { lat: number; lng: number } | null => {
    if (!location) return null;

    const normalized = location.toLowerCase().trim();

    // Try exact match first
    if (CITY_COORDINATES[normalized]) {
      return CITY_COORDINATES[normalized];
    }

    // Try partial match
    for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
      if (normalized.includes(city) || city.includes(normalized)) {
        return coords;
      }
    }

    // Return default (Stockholm) if no match
    return CITY_COORDINATES['default'];
  }, []);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback(
    (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371; // Earth's radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  // Fetch jobs and add coordinates
  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await searchJobs({ limit: 100 });

      // Add coordinates to jobs
      const jobsWithCoords: JobWithCoords[] = result.hits.map((job) => {
        const location =
          job.workplace_address?.municipality ||
          job.workplace_address?.city ||
          '';
        const coords = getCoordinates(location);

        let distance: number | undefined;
        if (homeCoords && coords) {
          distance = calculateDistance(
            homeCoords.lat,
            homeCoords.lng,
            coords.lat,
            coords.lng
          );
        }

        return { ...job, coords, distance };
      });

      // Sort by distance if home is set
      if (homeCoords) {
        jobsWithCoords.sort((a, b) => (a.distance || 999) - (b.distance || 999));
      }

      setJobs(jobsWithCoords);
    } catch (err) {
      console.error('Failed to fetch jobs for map:', err);
      setError(
        lang === 'en'
          ? 'Could not load jobs for map.'
          : 'Kunde inte ladda jobb för kartan.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [homeCoords]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !isGoogleMapsAvailable || mapInstanceRef.current) return;

    const initMap = () => {
      const center = homeCoords || CITY_COORDINATES['default'];

      mapInstanceRef.current = new google.maps.Map(mapRef.current!, {
        center,
        zoom: 11,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      setMapLoaded(true);
    };

    initMap();
  }, [isGoogleMapsAvailable, homeCoords]);

  // Update markers when jobs change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Clear existing circles
    circlesRef.current.forEach((circle) => circle.setMap(null));
    circlesRef.current = [];

    // Add comfort zone circle if home is set
    if (homeCoords) {
      const zone = COMFORT_ZONES[commuteMode];
      const circle = new google.maps.Circle({
        map: mapInstanceRef.current,
        center: homeCoords,
        radius: zone.radius * 1000, // Convert km to meters
        fillColor: zone.color,
        fillOpacity: 0.15,
        strokeColor: zone.color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
      });
      circlesRef.current.push(circle);

      // Add home marker
      new google.maps.Marker({
        map: mapInstanceRef.current,
        position: homeCoords,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 3,
        },
        title: lang === 'en' ? 'Your home' : 'Ditt hem',
      });
    }

    // Add job markers
    const currentZoneRadius = COMFORT_ZONES[commuteMode].radius;

    jobs.forEach((job) => {
      if (!job.coords) return;

      // Check if job is within current comfort zone
      const isWithinZone = job.distance !== undefined && job.distance <= currentZoneRadius;

      const marker = new google.maps.Marker({
        map: mapInstanceRef.current!,
        position: job.coords,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: isWithinZone ? '#10b981' : '#6b7280',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        title: job.headline,
      });

      marker.addListener('click', () => {
        setSelectedJob(job);
      });

      markersRef.current.push(marker);
    });
  }, [jobs, homeCoords, commuteMode, mapLoaded, lang]);

  // Set home location
  const handleSetHome = () => {
    if (!homeAddress) return;
    const coords = getCoordinates(homeAddress);
    if (coords) {
      setHomeCoords(coords);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter(coords);
        mapInstanceRef.current.setZoom(12);
      }
    }
  };

  // Use device location
  const handleUseMyLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setHomeCoords(coords);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(coords);
            mapInstanceRef.current.setZoom(12);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError(
            lang === 'en'
              ? 'Could not get your location.'
              : 'Kunde inte hämta din position.'
          );
        }
      );
    }
  };

  // Filter jobs within current comfort zone
  const jobsInZone = jobs.filter(
    (job) =>
      job.distance !== undefined &&
      job.distance <= COMFORT_ZONES[commuteMode].radius
  );

  if (isLoading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center py-16" role="status">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mr-3" />
        <span className="text-stone-600 dark:text-stone-400">
          {lang === 'en' ? 'Loading job map...' : 'Laddar jobbkarta...'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border-sky-200 dark:border-sky-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">
              {lang === 'en' ? 'Job Map' : 'Jobbkarta'}
            </h2>
            <p className="text-stone-600 dark:text-stone-400 text-sm">
              {lang === 'en'
                ? 'Find jobs near you based on your commute preferences'
                : 'Hitta jobb nära dig baserat på dina pendlingspreferenser'}
            </p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showSettings
                ? 'bg-sky-200 dark:bg-sky-800 text-sky-700 dark:text-sky-300'
                : 'hover:bg-sky-100 dark:hover:bg-sky-900/50 text-stone-600 dark:text-stone-400'
            )}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="mt-4 pt-4 border-t border-sky-200 dark:border-sky-700 space-y-4">
            {/* Home address input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                placeholder={
                  lang === 'en' ? 'Enter your home address...' : 'Ange din hemadress...'
                }
                className="flex-1 px-4 py-2 border border-stone-200 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
              />
              <Button onClick={handleSetHome} size="sm">
                <MapPin className="w-4 h-4 mr-1" />
                {lang === 'en' ? 'Set' : 'Sätt'}
              </Button>
              <Button
                onClick={handleUseMyLocation}
                variant="outline"
                size="sm"
              >
                <Locate className="w-4 h-4" />
              </Button>
            </div>

            {/* Comfort zone selector */}
            <div>
              <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                {lang === 'en' ? 'Commute comfort zone:' : 'Pendlingszon:'}
              </p>
              <div className="flex gap-2">
                {(Object.entries(COMFORT_ZONES) as [keyof typeof COMFORT_ZONES, typeof COMFORT_ZONES[keyof typeof COMFORT_ZONES]][]).map(([key, zone]) => (
                  <button
                    key={key}
                    onClick={() => setCommuteMode(key)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border-2',
                      commuteMode === key
                        ? 'border-current'
                        : 'border-transparent'
                    )}
                    style={{
                      backgroundColor:
                        commuteMode === key ? `${zone.color}20` : undefined,
                      color: zone.color,
                    }}
                  >
                    {zone.label} ({zone.radius} km)
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Map or fallback */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {isGoogleMapsAvailable ? (
            <div
              ref={mapRef}
              className="w-full h-[500px] rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700"
            />
          ) : (
            // Fallback: List view with distance indicators
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  {lang === 'en'
                    ? 'Map view requires Google Maps. Showing list view instead.'
                    : 'Kartvy kräver Google Maps. Visar listvy istället.'}
                </p>
              </div>

              <div className="space-y-3 max-h-[450px] overflow-y-auto">
                {jobs.slice(0, 20).map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={cn(
                      'p-3 rounded-lg cursor-pointer transition-colors border',
                      selectedJob?.id === job.id
                        ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-300 dark:border-sky-700'
                        : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-stone-800 dark:text-stone-100 line-clamp-1">
                          {job.headline}
                        </h4>
                        <p className="text-sm text-stone-600 dark:text-stone-400 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {job.employer?.name}
                        </p>
                      </div>
                      {job.distance !== undefined && (
                        <span
                          className={cn(
                            'text-sm font-medium px-2 py-0.5 rounded',
                            job.distance <= COMFORT_ZONES.toughDay.radius
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : job.distance <= COMFORT_ZONES.normalDay.radius
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              : job.distance <= COMFORT_ZONES.goodDay.radius
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                              : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                          )}
                        >
                          {job.distance.toFixed(1)} km
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar: Jobs within zone */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-3 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-sky-500" />
              {lang === 'en'
                ? `Jobs within ${COMFORT_ZONES[commuteMode].radius} km`
                : `Jobb inom ${COMFORT_ZONES[commuteMode].radius} km`}
            </h3>

            {homeCoords ? (
              jobsInZone.length > 0 ? (
                <div className="space-y-2 max-h-[430px] overflow-y-auto">
                  {jobsInZone.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={cn(
                        'p-3 rounded-lg cursor-pointer transition-colors border',
                        selectedJob?.id === job.id
                          ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-300 dark:border-sky-700'
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700'
                      )}
                    >
                      <h4 className="font-medium text-stone-800 dark:text-stone-100 text-sm line-clamp-1">
                        {job.headline}
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                          {job.employer?.name}
                        </span>
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          {job.distance?.toFixed(1)} km
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-8">
                  {lang === 'en'
                    ? 'No jobs found within your comfort zone. Try expanding the radius.'
                    : 'Inga jobb hittades inom din zon. Prova att utöka radien.'}
                </p>
              )
            ) : (
              <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-8">
                {lang === 'en'
                  ? 'Set your home address to see nearby jobs.'
                  : 'Ange din hemadress för att se jobb i närheten.'}
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Selected job detail */}
      {selectedJob && (
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                {selectedJob.headline}
              </h3>
              <p className="text-stone-600 dark:text-stone-400 flex items-center gap-2 mt-1">
                <Building2 className="w-4 h-4" />
                {selectedJob.employer?.name}
              </p>
              {selectedJob.workplace_address?.municipality && (
                <p className="text-stone-500 dark:text-stone-500 flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4" />
                  {selectedJob.workplace_address.municipality}
                  {selectedJob.distance !== undefined && (
                    <span className="text-sky-600 dark:text-sky-400 font-medium">
                      ({selectedJob.distance.toFixed(1)} km)
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Heart className="w-4 h-4 mr-1" />
                {lang === 'en' ? 'Save' : 'Spara'}
              </Button>
              {(selectedJob.application_details?.url || selectedJob.webpage_url) && (
                <a
                  href={selectedJob.application_details?.url || selectedJob.webpage_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    {lang === 'en' ? 'Apply' : 'Ansök'}
                  </Button>
                </a>
              )}
            </div>
          </div>

          {selectedJob.description?.text && (
            <p className="mt-4 text-stone-600 dark:text-stone-400 text-sm line-clamp-4">
              {selectedJob.description.text}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}

export default JobMapTab;
