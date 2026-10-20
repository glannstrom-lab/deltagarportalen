/**
 * Tyck till — idélåda och felrapport (FN15, beslut Mikael 2026-10-20).
 *
 * Klienten skickar { typ, meddelande, sida, sprak, klientfel, farKontakta }.
 * Den här funktionen:
 *   1. verifierar Bearer-token (auth.getUser) — user_id kommer härifrån,
 *      aldrig ur kroppen,
 *   2. begränsar till 5 inskick per 15 minuter per användare,
 *   3. maskerar personnummer i fritexten (samma mönster som stripPii i ai.js;
 *      kopierat med flit — att require:a ai.js här hade dragit in hela
 *      promptbiblioteket i den här funktionens bundle),
 *   4. skriver raden till `tyck_till` med service role (tabellen har ingen
 *      INSERT-policy för authenticated, se migration 20261020120000),
 *   5. mejlar en sammanfattning via Resend till TYCK_TILL_MOTTAGARE
 *      (standard support@jobin.se).
 *
 * Mejlet är best effort: raden är sparad och syns i adminpanelen även om
 * Resend är nere. `mejl_skickat` säger vilka som inte gick iväg.
 *
 * Kräver SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, EMAIL_FROM.
 */
const { createClient } = require('@supabase/supabase-js');
const { medFelrapport } = require('./_utils/sentry.js');
const { getRateLimitClient } = require('./_utils/rate-limit-client.js');
const { rateLimitFallback } = require('./_utils/rate-limit-fallback');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const RATE_LIMIT_CONFIG = { limit: 5, windowMinutes: 15 };
const MAX_MEDDELANDE = 4000;
const MAX_KLIENTFEL = 5;

// Samma policy som upload-image.js (SFT6/PUB-2): www.jobin.se först, ingen '*'.
const ALLOWED_ORIGINS = [
  'https://www.jobin.se',
  'https://jobin.se',
  'https://deltagarportalen.vercel.app',
  process.env.FRONTEND_URL,
  ...(process.env.NODE_ENV !== 'production' ? [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
  ] : []),
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : null,
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
].filter(Boolean);

/** @param {string} origin */
function getCorsHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/** Maskerar svenska person- och samordningsnummer. Mönstret är ai.js stripPii:s. */
function maskeraPersonnummer(text) {
  return String(text).replace(
    /\b(?:19|20)?\d{2}(?:0[1-9]|1[0-2])(?:[0-2][0-9]|3[01]|[6-8][0-9]|9[01])\s*[-+]?\s*\d{4}\b/g,
    '[BORTTAGET-PERSONNUMMER]'
  );
}

/** Kort, ren sträng eller null. */
function kort(v, max) {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s ? s.slice(0, max) : null;
}

/**
 * Validerar och städar kroppen. Returnerar { fel } eller { rad }.
 * @param {any} body
 */
function tolkaInskick(body) {
  if (!body || typeof body !== 'object') return { fel: 'Ogiltig förfrågan' };
  const typ = body.typ;
  if (typ !== 'ide' && typ !== 'fel') return { fel: 'Ogiltig typ' };
  const meddelande = typeof body.meddelande === 'string' ? body.meddelande.trim() : '';
  if (!meddelande) return { fel: 'Skriv något först' };
  if (meddelande.length > MAX_MEDDELANDE) return { fel: 'Texten är för lång' };

  const klientfel = Array.isArray(body.klientfel)
    ? body.klientfel.slice(-MAX_KLIENTFEL).map((f) => maskeraPersonnummer(String(f)).slice(0, 300))
    : [];

  return {
    rad: {
      typ,
      meddelande: maskeraPersonnummer(meddelande),
      // Sidan är en hash-route. Frågesträngen kan bära id:n — den skickas inte.
      sida: kort(typeof body.sida === 'string' ? body.sida.split('?')[0] : null, 200),
      sprak: kort(body.sprak, 10),
      klientfel,
      far_kontakta: body.farKontakta === true,
    },
  };
}

/** @param {unknown} s */
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/**
 * Mejlet till den som läser inskicken. Färger inline (DE1-lärdomen).
 * E-postadressen tas bara med när användaren kryssat i att vi får höra av oss.
 */
function byggMejl(rad, epost) {
  const rubrik = rad.typ === 'fel' ? 'Felrapport' : 'Ny idé';
  const fakta = [
    ['Sida', rad.sida || '–'],
    ['Roll', rad.roll || '–'],
    ['Språk', rad.sprak || '–'],
    ['Webbläsare', rad.webblasare || '–'],
    ['Får kontaktas', rad.far_kontakta ? `Ja – ${epost || 'e-post saknas'}` : 'Nej'],
  ];
  const felrader = rad.klientfel.length
    ? `<p style="margin:16px 0 4px;font-size:13px;color:#57534e;">Senaste fel i webbläsaren</p><pre style="margin:0;padding:10px;background:#f5f5f4;border-radius:6px;font-size:12px;white-space:pre-wrap;color:#1c1917;">${esc(rad.klientfel.join('\n'))}</pre>`
    : '';
  const html = `<!doctype html><html lang="sv"><body style="margin:0;padding:24px;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1917;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:12px;padding:24px 28px;">
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#57534e;">Tyck till</p>
    <h1 style="margin:0 0 14px;font-size:20px;color:#1c1917;">${rubrik}</h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5;white-space:pre-wrap;color:#1c1917;">${esc(rad.meddelande)}</p>
    <table style="font-size:14px;color:#1c1917;border-collapse:collapse;">${fakta.map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#57534e;">${k}</td><td style="padding:2px 0;">${esc(v)}</td></tr>`).join('')}</table>
    ${felrader}
  </div></body></html>`;
  const text = `${rubrik}\n\n${rad.meddelande}\n\n${fakta.map(([k, v]) => `${k}: ${v}`).join('\n')}${rad.klientfel.length ? `\n\nSenaste fel:\n${rad.klientfel.join('\n')}` : ''}`;
  return { subject: `Tyck till: ${rubrik.toLowerCase()} – ${rad.meddelande.slice(0, 60)}`, html, text };
}

async function checkRateLimit(client, userId) {
  try {
    const { data, error } = await client.rpc('check_rate_limit', {
      p_identifier: userId,
      p_endpoint: 'tyck-till',
      p_max_requests: RATE_LIMIT_CONFIG.limit,
      p_window_minutes: RATE_LIMIT_CONFIG.windowMinutes,
    });
    if (error || !data || data.length === 0) return rateLimitFallback(userId, 'tyck-till', RATE_LIMIT_CONFIG);
    return { allowed: data[0].allowed };
  } catch {
    return rateLimitFallback(userId, 'tyck-till', RATE_LIMIT_CONFIG);
  }
}

const hanterare = async function handler(req, res) {
  Object.entries(getCorsHeaders(req.headers.origin || '')).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('[tyck-till] SUPABASE_SERVICE_ROLE_KEY saknas');
    return res.status(500).json({ error: 'Not configured' });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: { user }, error: authError } = await admin.auth.getUser(authHeader.substring(7));
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

  const rl = await checkRateLimit(getRateLimitClient() || admin, user.id);
  if (!rl.allowed) return res.status(429).json({ error: 'Du har skickat flera på kort tid. Försök igen om en stund.' });

  const tolkat = tolkaInskick(req.body);
  if (tolkat.fel) return res.status(400).json({ error: tolkat.fel });

  // Rollen läses ur databasen, inte ur klienten.
  const { data: profil } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const ua = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'].slice(0, 300) : null;
  const rad = { ...tolkat.rad, user_id: user.id, roll: profil?.role || null, webblasare: ua };

  const { data: sparad, error: sparfel } = await admin.from('tyck_till').insert(rad).select('id').single();
  if (sparfel || !sparad) {
    console.error('[tyck-till] kunde inte spara', sparfel?.message);
    return res.status(500).json({ error: 'Kunde inte spara' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const till = process.env.TYCK_TILL_MOTTAGARE || 'support@jobin.se';
  if (resendApiKey && emailFrom) {
    try {
      const { subject, html, text } = byggMejl(rad, rad.far_kontakta ? user.email : null);
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: emailFrom,
          to: [till],
          subject,
          html,
          text,
          ...(rad.far_kontakta && user.email ? { reply_to: user.email } : {}),
        }),
      });
      if (r.ok) {
        await admin.from('tyck_till').update({ mejl_skickat: true }).eq('id', sparad.id);
      } else {
        console.error('[tyck-till] Resend', r.status);
      }
    } catch (e) {
      console.error('[tyck-till] mejlet gick inte iväg', e);
    }
  }

  return res.status(200).json({ ok: true });
};

module.exports = medFelrapport('tyck-till', hanterare);
module.exports.tolkaInskick = tolkaInskick;
module.exports.maskeraPersonnummer = maskeraPersonnummer;
module.exports.byggMejl = byggMejl;
