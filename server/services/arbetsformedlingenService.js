/**
 * Arbetsförmedlingen Service
 * Backend-service för att hantera API-anrop till Platsbanken
 */

const axios = require('axios');

const AF_API_BASE = 'https://jobsearch.api.jobtechdev.se';
const CACHE_TTL = 5 * 60 * 1000; // 5 minuter

// Enkel cache
const cache = new Map();

function getCacheKey(endpoint, params) {
  return `${endpoint}:${JSON.stringify(params)}`;
}

function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Sök jobb
async function searchJobs(params = {}) {
  const cacheKey = getCacheKey('search', params);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${AF_API_BASE}/search`, {
      params: {
        q: params.q,
        municipality: params.municipality,
        occupation: params.occupation,
        employment_type: params.employment_type,
        offset: params.offset || 0,
        limit: params.limit || 20
      },
      timeout: 10000
    });

    setCache(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error('Arbetsförmedlingen API error:', error.message);
    
    // Om API är nere, returnera mock-data
    if (error.code === 'ECONNABORTED' || error.response?.status >= 500) {
      console.log('Returning mock data due to API unavailability');
      return getMockSearchResults();
    }
    
    throw error;
  }
}

// Hämta jobbdetaljer
async function getJobDetails(id) {
  const cacheKey = getCacheKey('job', { id });
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${AF_API_BASE}/ad/${id}`, {
      timeout: 5000
    });

    setCache(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching job details:', error.message);
    return null;
  }
}

// Autocomplete
async function getAutocomplete(query) {
  if (!query || query.length < 2) return [];

  const cacheKey = getCacheKey('complete', { q: query });
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${AF_API_BASE}/complete`, {
      params: { q: query },
      timeout: 3000
    });

    setCache(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error('Autocomplete error:', error.message);
    return { typeahead: [] };
  }
}

// Marknadsstatistik
async function getMarketStats() {
  const cacheKey = 'market-stats';
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${AF_API_BASE}/search`, {
      params: { limit: 0 },
      timeout: 5000
    });

    const stats = {
      totalJobs: response.data?.total?.value || 0,
      lastUpdated: new Date().toISOString(),
      status: 'live'
    };

    setCache(cacheKey, stats);
    return stats;
  } catch (error) {
    console.error('Market stats error:', error.message);
    return {
      totalJobs: 0,
      lastUpdated: new Date().toISOString(),
      status: 'unavailable',
      message: 'Arbetsförmedlingens API är tillfälligt otillgängligt'
    };
  }
}

// Mock-data vid API-fel
function getMockSearchResults() {
  return {
    total: { value: 0 },
    hits: [],
    mock: true,
    message: 'Visar simulerad data - Arbetsförmedlingens API är tillfälligt otillgängligt'
  };
}

// Rensa gammal cache periodiskt
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, CACHE_TTL);

module.exports = {
  searchJobs,
  getJobDetails,
  getAutocomplete,
  getMarketStats
};
