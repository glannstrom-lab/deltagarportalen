// Mikro-Lärande Hub - Progress-spårning
// Hanterar uppdateringar av kursprogress och belöningar

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProgressUpdate {
  recommendationId: string;
  progressPercent: number;
  timeSpentMinutes?: number;
  notes?: string;
}

async function checkAchievements(supabase: any, userId: string, activityType: string) {
  const achievements = [];
  
  // Hämta användarens statistik
  const { data: stats } = await supabase
    .rpc('get_user_learning_stats', { p_user_id: userId });
    
  if (!stats) return achievements;
  
  // Kontrollera olika achievements
  if (stats.total_courses_completed === 1) {
    achievements.push({
      id: 'first_course',
      title: 'Första kursen klar!',
      description: 'Du har avslutat din första kurs',
      icon: '🎓'
    });
  }
  
  if (stats.total_courses_completed === 5) {
    achievements.push({
      id: 'five_courses',
      title: 'Lärandemästare',
      description: '5 kurser avslutade',
      icon: '🏆'
    });
  }
  
  if (stats.total_time_spent_minutes >= 60) {
    achievements.push({
      id: 'one_hour',
      title: 'En timme av lärande',
      description: 'Du har lagt över en timme på kompetensutveckling',
      icon: '⏱️'
    });
  }
  
  if (stats.current_streak_days >= 3) {
    achievements.push({
      id: 'three_day_streak',
      title: '3 dagar i rad!',
      description: 'Du lär dig något nytt varje dag',
      icon: '🔥'
    });
  }
  
  return achievements;
}

async function updateLearningPathStatus(supabase: any, pathId: string) {
  // Räkna hur många rekommendationer som är klara för denna path
  const { data: recommendations, error } = await supabase
    .from('course_recommendations')
    .select('status')
    .eq('learning_path_id', pathId);
    
  if (error || !recommendations) return;
  
  const completed = recommendations.filter(r => r.status === 'COMPLETED').length;
  const total = recommendations.length;
  
  // Om mer än 50% är klara, markera path som nästan klar
  if (completed > 0 && completed >= total * 0.5) {
    await supabase
      .from('user_learning_paths')
      .update({ status: completed === total ? 'COMPLETED' : 'ACTIVE' })
      .eq('id', pathId);
  }
}

async function syncToCV(supabase: any, userId: string, courseTitle: string, provider: string) {
  // Skapa en certifiering för avslutad kurs
  const { error } = await supabase
    .from('user_certifications')
    .insert({
      user_id: userId,
      title: courseTitle,
      issuer: provider,
      issue_date: new Date().toISOString().split('T')[0],
      is_visible_in_cv: true
    });
    
  if (error) {
    console.error('Error syncing to CV:', error);
  }
}

async function notifyConsultant(supabase: any, userId: string, courseTitle: string) {
  // Hämta användarens konsulent
  const { data: profile } = await supabase
    .from('profiles')
    .select('consultant_id, full_name')
    .eq('id', userId)
    .single();
    
  if (!profile?.consultant_id) return;
  
  // Skapa notifikation till konsulenten
  await supabase
    .from('notifications')
    .insert({
      user_id: profile.consultant_id,
      type: 'participant_progress',
      title: `${profile.full_name} har avslutat en kurs`,
      message: `${profile.full_name} har just slutfört "${courseTitle}"`,
      data: { participant_id: userId, course_title: courseTitle }
    });
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      recommendationId, 
      progressPercent, 
      timeSpentMinutes = 0,
      notes,
      action = 'update' // 'update', 'complete', 'bookmark', 'rate'
    } = body;

    if (!recommendationId) {
      return new Response(
        JSON.stringify({ error: 'Recommendation ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Hämta rekommendationen för att verifiera ägarskap och hämta kursinfo
    const { data: recommendation, error: recError } = await supabase
      .from('course_recommendations')
      .select('*, courses(title, provider)')
      .eq('id', recommendationId)
      .eq('user_id', user.id)
      .single();
      
    if (recError || !recommendation) {
      return new Response(
        JSON.stringify({ error: 'Recommendation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let activityType = 'PROGRESS_UPDATE';
    let isCompleted = false;
    let achievements = [];

    // Hantera olika actions
    switch (action) {
      case 'update':
        // Uppdatera progress
        const { error: updateError } = await supabase
          .from('course_recommendations')
          .update({
            progress_percent: progressPercent,
            time_spent_minutes: recommendation.time_spent_minutes + timeSpentMinutes,
            status: progressPercent >= 100 ? 'COMPLETED' : 'STARTED',
            started_at: recommendation.started_at || new Date().toISOString(),
            completed_at: progressPercent >= 100 ? new Date().toISOString() : null
          })
          .eq('id', recommendationId);
          
        if (updateError) throw updateError;
        
        if (progressPercent >= 100) {
          activityType = 'COMPLETED';
          isCompleted = true;
        }
        break;
        
      case 'complete':
        // Markera som klar direkt
        const { error: completeError } = await supabase
          .from('course_recommendations')
          .update({
            progress_percent: 100,
            status: 'COMPLETED',
            completed_at: new Date().toISOString()
          })
          .eq('id', recommendationId);
          
        if (completeError) throw completeError;
        activityType = 'COMPLETED';
        isCompleted = true;
        break;
        
      case 'bookmark':
        // Bokmärk för senare
        const { error: bookmarkError } = await supabase
          .from('course_recommendations')
          .update({ status: 'BOOKMARKED' })
          .eq('id', recommendationId);
          
        if (bookmarkError) throw bookmarkError;
        activityType = 'BOOKMARKED';
        break;
        
      case 'rate':
        // Betygsätt kursen
        const { rating } = body;
        const { error: rateError } = await supabase
          .from('learning_activities')
          .insert({
            user_id: user.id,
            recommendation_id: recommendationId,
            activity_type: 'RATED',
            rating: rating
          });
          
        if (rateError) throw rateError;
        activityType = 'RATED';
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Logga aktiviteten
    if (action !== 'rate') {
      await supabase
        .from('learning_activities')
        .insert({
          user_id: user.id,
          recommendation_id: recommendationId,
          activity_type: activityType,
          progress_percent: progressPercent,
          notes: notes
        });
    }

    // Om kursen är avslutad
    if (isCompleted) {
      // Uppdatera learning path status
      await updateLearningPathStatus(supabase, recommendation.learning_path_id);
      
      // Synka till CV
      await syncToCV(supabase, user.id, recommendation.courses.title, recommendation.courses.provider);
      
      // Notifiera konsulent
      await notifyConsultant(supabase, user.id, recommendation.courses.title);
      
      // Kolla achievements
      achievements = await checkAchievements(supabase, user.id, activityType);
    }

    // Hämta uppdaterad statistik
    const { data: stats } = await supabase
      .rpc('get_user_learning_stats', { p_user_id: user.id });

    return new Response(
      JSON.stringify({
        success: true,
        action,
        isCompleted,
        achievements,
        stats,
        message: isCompleted 
          ? `Grattis! Du har avslutat "${recommendation.courses.title}"` 
          : 'Progress uppdaterad'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in learning-progress:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
