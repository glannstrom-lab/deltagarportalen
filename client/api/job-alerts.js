/**
 * Job Alerts Email Notification Service
 * Vercel Serverless Function for sending job alert emails
 *
 * Endpoints:
 * - POST /api/job-alerts?action=check - Check for new jobs and send notifications
 * - POST /api/job-alerts?action=send-digest - Send daily digest email
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// Arbetsförmedlingen API
const AF_API_URL = 'https://jobsearch.api.jobtechdev.se/search';

// Email templates
const templates = {
  newJobsAlert: (alertName, jobs, userEmail) => ({
    subject: `🔔 ${jobs.length} nya jobb matchar "${alertName}"`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nya jobbmatchningar</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 30px; border-radius: 16px 16px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 24px;">🔔 Nya jobbmatchningar</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Din bevakning "${alertName}" har ${jobs.length} nya träffar</p>
    </div>

    <div style="background: white; padding: 20px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      ${jobs.slice(0, 5).map(job => `
        <div style="border-bottom: 1px solid #e5e5e5; padding: 15px 0;">
          <h3 style="margin: 0 0 5px 0; color: #1f2937;">${job.headline || job.title}</h3>
          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">${job.employer?.name || job.company}</p>
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            📍 ${job.workplace_address?.municipality || job.location || 'Plats ej angiven'}
            ${job.publication_date ? ` • 📅 ${new Date(job.publication_date).toLocaleDateString('sv-SE')}` : ''}
          </p>
          <a href="https://arbetsformedlingen.se/platsbanken/annonser/${job.id}"
             style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #14b8a6; color: white; text-decoration: none; border-radius: 8px; font-size: 14px;">
            Läs mer →
          </a>
        </div>
      `).join('')}

      ${jobs.length > 5 ? `
        <p style="text-align: center; padding: 15px 0; color: #6b7280;">
          ... och ${jobs.length - 5} fler jobb
        </p>
      ` : ''}

      <div style="text-align: center; padding-top: 20px;">
        <a href="${process.env.VITE_APP_URL || 'https://deltagarportalen.se'}/job-search"
           style="display: inline-block; padding: 12px 24px; background: #0d9488; color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">
          Se alla matchningar
        </a>
      </div>
    </div>

    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p>Du får detta mail för att du har en aktiv bevakning.</p>
      <p>
        <a href="${process.env.VITE_APP_URL || 'https://deltagarportalen.se'}/job-search?tab=alerts" style="color: #14b8a6;">
          Hantera bevakningar
        </a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Nya jobbmatchningar för "${alertName}"\n\n${jobs.slice(0, 5).map(job =>
      `${job.headline || job.title}\n${job.employer?.name || job.company}\n${job.workplace_address?.municipality || 'Plats ej angiven'}\n`
    ).join('\n')}\n\nSe alla matchningar: ${process.env.VITE_APP_URL || 'https://deltagarportalen.se'}/job-search`
  }),

  dailyDigest: (alerts, userEmail) => {
    const totalJobs = alerts.reduce((sum, a) => sum + a.newJobs.length, 0);
    return {
      subject: `📊 Din dagliga jobbsammanfattning - ${totalJobs} nya jobb`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; border-radius: 16px 16px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 24px;">📊 Din dagliga jobbsammanfattning</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
    </div>

    <div style="background: white; padding: 20px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <div style="background: #f3f4f6; padding: 15px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">Totalt nya jobb idag</p>
        <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 36px; font-weight: bold;">${totalJobs}</p>
      </div>

      ${alerts.map(alert => `
        <div style="border: 1px solid #e5e5e5; border-radius: 12px; padding: 15px; margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; color: #1f2937; font-size: 16px;">🔔 ${alert.name}</h3>
            <span style="background: ${alert.newJobs.length > 0 ? '#dcfce7' : '#f3f4f6'}; color: ${alert.newJobs.length > 0 ? '#166534' : '#6b7280'}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
              ${alert.newJobs.length} nya
            </span>
          </div>
          ${alert.newJobs.length > 0 ? `
            <div style="margin-top: 10px;">
              ${alert.newJobs.slice(0, 2).map(job => `
                <p style="margin: 5px 0; font-size: 14px; color: #4b5563;">
                  • ${job.headline || job.title} - ${job.employer?.name || job.company}
                </p>
              `).join('')}
              ${alert.newJobs.length > 2 ? `<p style="margin: 5px 0; font-size: 12px; color: #9ca3af;">... och ${alert.newJobs.length - 2} fler</p>` : ''}
            </div>
          ` : ''}
        </div>
      `).join('')}

      <div style="text-align: center; padding-top: 10px;">
        <a href="${process.env.VITE_APP_URL || 'https://deltagarportalen.se'}/job-search"
           style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">
          Utforska alla jobb
        </a>
      </div>
    </div>
  </div>
</body>
</html>
      `,
      text: `Din dagliga jobbsammanfattning\n${totalJobs} nya jobb idag\n\n${alerts.map(a => `${a.name}: ${a.newJobs.length} nya jobb`).join('\n')}`
    };
  }
};

// Search jobs from Arbetsförmedlingen
async function searchJobs(params) {
  const searchParams = new URLSearchParams();
  if (params.query) searchParams.append('q', params.query);
  if (params.region) searchParams.append('region', params.region);
  if (params.municipality) searchParams.append('municipality', params.municipality);
  if (params.remote) searchParams.append('remote', 'true');
  if (params.publishedAfter) searchParams.append('published-after', params.publishedAfter);
  searchParams.append('limit', params.limit || '20');

  try {
    const response = await fetch(`${AF_API_URL}?${searchParams.toString()}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`AF API error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error searching jobs:', error);
    return { hits: [] };
  }
}

// Send email via Supabase (using pg_net or edge function)
// In production, replace with Resend/SendGrid/etc.
async function sendEmail(to, subject, html, text) {
  // Log email for now (in production, integrate with email service)
  console.log(`📧 Email to ${to}: ${subject}`);

  // Store notification in database
  try {
    await supabase.from('email_notifications').insert({
      recipient: to,
      subject,
      body_html: html,
      body_text: text,
      status: 'pending',
      created_at: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error storing email notification:', error);

    // Fallback: store in user_notifications table
    try {
      await supabase.from('user_notifications').insert({
        type: 'job_alert',
        title: subject,
        message: text?.substring(0, 500),
        read: false,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('Fallback notification also failed:', e);
    }
    return false;
  }
}

// Check alerts for a specific user
async function checkUserAlerts(userId) {
  // Get user's active alerts
  const { data: alerts, error: alertsError } = await supabase
    .from('job_alerts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (alertsError || !alerts?.length) {
    return { checked: 0, newJobs: 0 };
  }

  // Get user email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();

  const userEmail = profile?.email;
  let totalNewJobs = 0;

  for (const alert of alerts) {
    // Search for new jobs since last check
    const lastChecked = alert.last_checked_at || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const result = await searchJobs({
      query: alert.query,
      region: alert.region,
      municipality: alert.municipality,
      remote: alert.remote,
      publishedAfter: lastChecked,
      limit: 50
    });

    const newJobs = result.hits || [];

    if (newJobs.length > 0) {
      totalNewJobs += newJobs.length;

      // Update alert with new job count
      await supabase
        .from('job_alerts')
        .update({
          new_jobs_count: newJobs.length,
          last_checked_at: new Date().toISOString()
        })
        .eq('id', alert.id);

      // Store notifications
      for (const job of newJobs.slice(0, 10)) {
        await supabase.from('job_notifications').upsert({
          alert_id: alert.id,
          user_id: userId,
          job_id: job.id,
          job_title: job.headline,
          employer: job.employer?.name,
          location: job.workplace_address?.municipality,
          publication_date: job.publication_date,
          read: false,
          created_at: new Date().toISOString()
        }, { onConflict: 'alert_id,job_id' });
      }

      // Send email notification if enabled
      if (userEmail && alert.notification_frequency !== 'none') {
        const template = templates.newJobsAlert(alert.name, newJobs, userEmail);
        await sendEmail(userEmail, template.subject, template.html, template.text);
      }
    } else {
      // Just update last checked time
      await supabase
        .from('job_alerts')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('id', alert.id);
    }
  }

  return { checked: alerts.length, newJobs: totalNewJobs };
}

// Check all active alerts (for cron job)
async function checkAllAlerts() {
  // Get all users with active alerts
  const { data: userIds, error } = await supabase
    .from('job_alerts')
    .select('user_id')
    .eq('is_active', true);

  if (error || !userIds?.length) {
    return { users: 0, alerts: 0, newJobs: 0 };
  }

  const uniqueUsers = [...new Set(userIds.map(u => u.user_id))];
  let totalAlerts = 0;
  let totalNewJobs = 0;

  for (const userId of uniqueUsers) {
    const result = await checkUserAlerts(userId);
    totalAlerts += result.checked;
    totalNewJobs += result.newJobs;
  }

  return { users: uniqueUsers.length, alerts: totalAlerts, newJobs: totalNewJobs };
}

// Send daily digest to a user
async function sendDailyDigest(userId) {
  // Get user's alerts with their new jobs
  const { data: alerts, error } = await supabase
    .from('job_alerts')
    .select('*, job_notifications(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('notification_frequency', 'daily');

  if (error || !alerts?.length) return false;

  // Get user email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();

  if (!profile?.email) return false;

  // Format alerts with new jobs
  const alertsWithJobs = alerts.map(alert => ({
    name: alert.name,
    newJobs: (alert.job_notifications || []).filter(n => !n.read)
  }));

  if (alertsWithJobs.every(a => a.newJobs.length === 0)) {
    return false; // No new jobs, skip digest
  }

  const template = templates.dailyDigest(alertsWithJobs, profile.email);
  await sendEmail(profile.email, template.subject, template.html, template.text);

  return true;
}

// Main handler
module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = req.query.action || req.body?.action;

  try {
    switch (action) {
      case 'check': {
        // Check all alerts (for cron)
        const result = await checkAllAlerts();
        return res.json({
          success: true,
          message: `Checked ${result.alerts} alerts for ${result.users} users, found ${result.newJobs} new jobs`,
          ...result
        });
      }

      case 'check-user': {
        // Check alerts for specific user
        const userId = req.body?.userId;
        if (!userId) {
          return res.status(400).json({ error: 'userId required' });
        }
        const result = await checkUserAlerts(userId);
        return res.json({ success: true, ...result });
      }

      case 'send-digest': {
        // Send daily digest to specific user or all
        const userId = req.body?.userId;
        if (userId) {
          const sent = await sendDailyDigest(userId);
          return res.json({ success: true, sent });
        } else {
          // Send to all users with daily frequency
          const { data: users } = await supabase
            .from('job_alerts')
            .select('user_id')
            .eq('is_active', true)
            .eq('notification_frequency', 'daily');

          const uniqueUsers = [...new Set((users || []).map(u => u.user_id))];
          let sentCount = 0;
          for (const uid of uniqueUsers) {
            const sent = await sendDailyDigest(uid);
            if (sent) sentCount++;
          }
          return res.json({ success: true, digestsSent: sentCount, totalUsers: uniqueUsers.length });
        }
      }

      default:
        return res.status(400).json({ error: 'Invalid action. Use: check, check-user, send-digest' });
    }
  } catch (error) {
    console.error('Job alerts error:', error);
    return res.status(500).json({ error: error.message });
  }
};
