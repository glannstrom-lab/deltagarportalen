/**
 * Health Check Edge Function
 * Monitors service health for uptime tracking and alerting
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      latencyMs?: number;
      error?: string;
    };
    auth: {
      status: 'ok' | 'error';
      error?: string;
    };
    storage: {
      status: 'ok' | 'error';
      error?: string;
    };
  };
  uptime?: number;
}

// Track uptime
const startTime = Date.now();

serve(async (req) => {
  // Allow GET requests without authentication for monitoring services
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: Deno.env.get('APP_VERSION') || 'unknown',
        error: 'Missing configuration',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  const health: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: Deno.env.get('APP_VERSION') || '1.0.0',
    checks: {
      database: { status: 'ok' },
      auth: { status: 'ok' },
      storage: { status: 'ok' },
    },
    uptime: Date.now() - startTime,
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    const { error: dbError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    health.checks.database.latencyMs = Date.now() - dbStart;

    if (dbError) {
      health.checks.database.status = 'error';
      health.checks.database.error = dbError.message;
      health.status = 'degraded';
    }
  } catch (e) {
    health.checks.database.status = 'error';
    health.checks.database.error = e instanceof Error ? e.message : 'Unknown error';
    health.status = 'unhealthy';
  }

  // Check auth service
  try {
    const { error: authError } = await supabase.auth.getSession();
    if (authError) {
      health.checks.auth.status = 'error';
      health.checks.auth.error = authError.message;
      health.status = health.status === 'healthy' ? 'degraded' : health.status;
    }
  } catch (e) {
    health.checks.auth.status = 'error';
    health.checks.auth.error = e instanceof Error ? e.message : 'Unknown error';
    health.status = 'degraded';
  }

  // Check storage
  try {
    const { error: storageError } = await supabase.storage.listBuckets();
    if (storageError) {
      health.checks.storage.status = 'error';
      health.checks.storage.error = storageError.message;
      health.status = health.status === 'healthy' ? 'degraded' : health.status;
    }
  } catch (e) {
    health.checks.storage.status = 'error';
    health.checks.storage.error = e instanceof Error ? e.message : 'Unknown error';
    health.status = 'degraded';
  }

  // Determine HTTP status code
  const statusCode = health.status === 'healthy' ? 200
    : health.status === 'degraded' ? 200
    : 503;

  return new Response(
    JSON.stringify(health, null, 2),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        // Allow monitoring services to call this endpoint
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    }
  );
});
