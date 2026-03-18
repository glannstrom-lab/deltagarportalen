// Mikro-Lärande Hub - Kursrekommendationer
// Hittar och rekommenderar kurser baserat på kompetensgap och användarpreferenser

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightOrNull, createCorsResponse } from '../_shared/cors.ts';

interface RecommendationFilters {
  maxDuration?: number;
  difficulty?: ('BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')[];
  freeOnly?: boolean;
  language?: 'sv' | 'en' | 'any';
  provider?: string[];
}

interface UserContext {
  energyLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  weeklyTimeAvailable?: number; // minutes per week
  preferredLearningStyle?: 'video' | 'reading' | 'interactive';
}

function calculateEnergyScore(course: any, userContext: UserContext): number {
  const energyLevel = userContext.energyLevel || 'MEDIUM';
  const duration = course.duration_minutes || 60;
  
  // Låg energi = korta kurser får högre poäng
  switch (energyLevel) {
    case 'LOW':
      if (duration <= 5) return 100;
      if (duration <= 15) return 80;
      if (duration <= 30) return 50;
      return 20;
    case 'MEDIUM':
      if (duration <= 15) return 100;
      if (duration <= 30) return 90;
      if (duration <= 60) return 70;
      return 40;
    case 'HIGH':
    default:
      if (duration <= 30) return 90;
      if (duration <= 60) return 100;
      return 80;
  }
}

function calculateRelevanceScore(course: any, targetSkill: string, userContext: UserContext): number {
  let score = 50; // Baspoäng
  
  // 1. Matchning mot target skill (30%)
  const skillTags = course.skills_tags || [];
  const skillMatch = skillTags.some((tag: string) => 
    tag.toLowerCase().includes(targetSkill.toLowerCase()) ||
    targetSkill.toLowerCase().includes(tag.toLowerCase())
  );
  if (skillMatch) score += 30;
  
  // 2. Energianpassning (15%)
  const energyScore = calculateEnergyScore(course, userContext);
  score += (energyScore / 100) * 15;
  
  // 3. Kvalitet (15%) - baserat på rating och reviews
  const rating = course.rating || 3.0;
  const reviewCount = course.review_count || 0;
  const qualityScore = (rating / 5) * 10 + Math.min(reviewCount / 100, 5);
  score += qualityScore;
  
  // 4. Kostnad (5%) - gratis får bonus
  if (course.is_free) score += 5;
  
  // 5. Svårighetsgrad anpassning (10%)
  const difficulty = course.difficulty_level;
  const userLevel = userContext.preferredLearningStyle ? 'BEGINNER' : 'BEGINNER';
  if (difficulty === 'BEGINNER' || difficulty === 'ALL_LEVELS') {
    score += 10;
  } else if (difficulty === 'INTERMEDIATE') {
    score += 5;
  }
  
  // 6. Popularitet (10%)
  const views = course.view_count || 0;
  score += Math.min(views / 1000, 10);
  
  return Math.min(Math.round(score), 100);
}

function generateMatchReason(course: any, targetSkill: string, score: number, energyLevel?: string): string {
  const reasons: string[] = [];
  
  // Skill-match
  const skillTags = course.skills_tags || [];
  const hasExactMatch = skillTags.some((tag: string) => 
    tag.toLowerCase() === targetSkill.toLowerCase()
  );
  
  if (hasExactMatch) {
    reasons.push(`Direkt match för ${targetSkill}`);
  } else if (skillTags.some((tag: string) => tag.toLowerCase().includes(targetSkill.toLowerCase()))) {
    reasons.push(`Relaterad kompetens till ${targetSkill}`);
  }
  
  // Längd
  const duration = course.duration_minutes;
  if (energyLevel === 'LOW' && duration && duration <= 15) {
    reasons.push('Kort och hanterbar för låg energi');
  } else if (duration && duration <= 30) {
    reasons.push('Passar för mikro-lärande');
  }
  
  // Kostnad
  if (course.is_free) {
    reasons.push('Gratis att ta');
  }
  
  // Kvalitet
  if (course.rating && course.rating >= 4.5) {
    reasons.push('Högt betyg av andra användare');
  }
  
  // Svårighetsgrad
  if (course.difficulty_level === 'BEGINNER') {
    reasons.push('Perfekt för nybörjare');
  }
  
  return reasons[0] || 'Rekommenderad för din profil';
}

async function findExistingRecommendations(supabase: any, userId: string, pathId: string) {
  const { data, error } = await supabase
    .from('course_recommendations')
    .select('course_id')
    .eq('user_id', userId)
    .eq('learning_path_id', pathId);
    
  if (error) {
    console.error('Error fetching existing recommendations:', error);
    return new Set();
  }
  
  return new Set(data?.map(r => r.course_id) || []);
}

async function generateRecommendations(
  supabase: any,
  userId: string,
  learningPathId: string,
  targetSkill: string,
  filters: RecommendationFilters,
  userContext: UserContext,
  maxResults: number = 10
) {
  // Hämta existerande rekommendationer för att undvika dubbletter
  const existingCourseIds = await findExistingRecommendations(supabase, userId, learningPathId);
  
  // Bygg query
  let query = supabase
    .from('courses')
    .select('*')
    .eq('is_active', true);
  
  // Applicera filters
  if (filters.maxDuration) {
    query = query.lte('duration_minutes', filters.maxDuration);
  }
  
  if (filters.difficulty?.length > 0) {
    query = query.in('difficulty_level', filters.difficulty);
  }
  
  if (filters.freeOnly) {
    query = query.eq('is_free', true);
  }
  
  if (filters.language && filters.language !== 'any') {
    query = query.eq('language', filters.language);
  }
  
  if (filters.provider?.length > 0) {
    query = query.in('provider', filters.provider);
  }
  
  // Sök efter kurser som matchar target skill
  const { data: courses, error } = await query.limit(50);
  
  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
  
  // Filtrera bort existerande
  const newCourses = courses.filter(c => !existingCourseIds.has(c.id));
  
  // Beräkna scores
  const scoredCourses = newCourses.map(course => {
    const relevanceScore = calculateRelevanceScore(course, targetSkill, userContext);
    const energyScore = calculateEnergyScore(course, userContext);
    const energyLevel = energyScore >= 80 ? 'LOW' : energyScore >= 50 ? 'MEDIUM' : 'HIGH';
    
    return {
      course,
      relevanceScore,
      energyLevel,
      matchReason: generateMatchReason(course, targetSkill, relevanceScore, userContext.energyLevel)
    };
  });
  
  // Sortera efter relevance score
  scoredCourses.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  return scoredCourses.slice(0, maxResults);
}

async function saveRecommendations(
  supabase: any,
  userId: string,
  learningPathId: string,
  recommendations: any[]
) {
  const inserts = recommendations.map(rec => ({
    user_id: userId,
    learning_path_id: learningPathId,
    course_id: rec.course.id,
    match_reason: rec.matchReason,
    relevance_score: rec.relevanceScore,
    energy_level: rec.energyLevel,
    status: 'SUGGESTED'
  }));
  
  const { data, error } = await supabase
    .from('course_recommendations')
    .insert(inserts)
    .select('id, course_id, match_reason, relevance_score, energy_level');
    
  if (error) {
    console.error('Error saving recommendations:', error);
    return [];
  }
  
  return data;
}

serve(async (req) => {
  // Handle CORS
  const preflightResponse = handleCorsPreflightOrNull(req);
  if (preflightResponse) return preflightResponse;

  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    const { 
      learningPathId, 
      maxResults = 10,
      filters = {},
      userContext = {},
      autoSave = true 
    } = await req.json();

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let targetSkill: string;
    let pathId: string;
    
    // If learningPathId provided, get the skill from it
    if (learningPathId) {
      const { data: path, error: pathError } = await supabase
        .from('user_learning_paths')
        .select('id, target_skill')
        .eq('id', learningPathId)
        .eq('user_id', user.id)
        .single();
        
      if (pathError || !path) {
        return new Response(
          JSON.stringify({ error: 'Learning path not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      targetSkill = path.target_skill;
      pathId = path.id;
    } else {
      // Get all active learning paths
      const { data: paths, error: pathsError } = await supabase
        .from('user_learning_paths')
        .select('id, target_skill')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .order('priority', { ascending: false })
        .limit(1);
        
      if (pathsError || !paths || paths.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: 'No active learning paths found',
            message: 'Skapa först en kompetensplan för att få rekommendationer'
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      targetSkill = paths[0].target_skill;
      pathId = paths[0].id;
    }

    // Apply default filters based on user context
    const defaultFilters: RecommendationFilters = {
      freeOnly: true,
      language: 'sv',
      difficulty: ['BEGINNER', 'ALL_LEVELS'],
      ...filters
    };
    
    // Adjust filters based on energy level
    if (userContext.energyLevel === 'LOW' && !filters.maxDuration) {
      defaultFilters.maxDuration = 15;
    }

    // Generate recommendations
    const scoredRecommendations = await generateRecommendations(
      supabase,
      user.id,
      pathId,
      targetSkill,
      defaultFilters,
      userContext,
      maxResults
    );

    // Save to database if autoSave is true
    let savedRecommendations = [];
    if (autoSave && scoredRecommendations.length > 0) {
      savedRecommendations = await saveRecommendations(
        supabase,
        user.id,
        pathId,
        scoredRecommendations
      );
    }

    // Format response
    const response = {
      success: true,
      targetSkill,
      learningPathId: pathId,
      filters: defaultFilters,
      userContext,
      recommendations: scoredRecommendations.map((rec, index) => ({
        id: savedRecommendations[index]?.id || null,
        relevanceScore: rec.relevanceScore,
        energyLevel: rec.energyLevel,
        matchReason: rec.matchReason,
        course: {
          id: rec.course.id,
          title: rec.course.title,
          description: rec.course.description,
          provider: rec.course.provider,
          thumbnailUrl: rec.course.thumbnail_url,
          contentUrl: rec.course.content_url,
          durationMinutes: rec.course.duration_minutes,
          difficulty: rec.course.difficulty_level,
          isFree: rec.course.is_free,
          skills: rec.course.skills_tags,
          rating: rec.course.rating,
          viewCount: rec.course.view_count
        }
      })),
      summary: {
        total: scoredRecommendations.length,
        highRelevance: scoredRecommendations.filter(r => r.relevanceScore >= 70).length,
        energySuitable: scoredRecommendations.filter(r => {
          if (userContext.energyLevel === 'LOW') return r.energyLevel === 'LOW';
          return true;
        }).length
      }
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in learning-recommend:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
