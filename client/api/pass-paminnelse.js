/**
 * F3 — mejl kvällen innan ett pass (persona-genomgång 2026-09-12, förslag F3).
 *
 * Databasen lägger portalnotisen (`skicka_passpaminnelser()`, pg_cron 17:00 UTC,
 * migration 20260913010000). pg_net är av, så databasen kan inte anropa Resend —
 * det gör den här Vercel-funktionen: den läser dagens påminnelsenotiser
 * (`notifications.type = 'aktivitet_paminnelse'`, `data.mail_sent` saknas), slår upp
 * mottagarens e-post och brytaren `user_preferences.email_notifications`, skickar via
 * Resend och markerar `data.mail_sent`. Idempotent: en körning till skickar inget.
 *
 * Kräver, precis som job-alerts.js, CRON_SECRET (Vercel Cron skickar
 * `Authorization: Bearer <CRON_SECRET>`), RESEND_API_KEY och EMAIL_FROM. Saknad
 * avsändaradress är ett fel (DE2), aldrig en sandlådeadress.
 *
 * UTLÖSARE SAKNAS MED FLIT: raden i client/vercel.json `crons` kräver Mikaels ja —
 *   { "path": "/api/pass-paminnelse", "schedule": "30 17 * * *" }
 * (17:30 UTC = en halvtimme efter databasens notisjobb.)
 *
 * E-postbrytaren tolkas som i job-alerts (minnet notisstacken): saknad rad i
 * user_preferences = reglaget aldrig rört = skicka; `false` = skicka inte.
 */
const { createClient } = require('@supabase/supabase-js');
const { medFelrapport } = require('./_utils/sentry.js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// Service role krävs: notifications och profiles läses för andra användare.
// Faller ALDRIG tillbaka på anon-nyckeln — då hade RLS gett tomma svar som såg
// ut som "inga påminnelser i dag".
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

/** @param {{ headers: Record<string, string | string[] | undefined> }} req */
function verifyCronSecret(req) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const x = req.headers['x-cron-secret'];
  if (typeof x === 'string' && constantTimeEqual(x, expected)) return true;
  const auth = req.headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ') && constantTimeEqual(auth.slice(7), expected)) return true;
  return false;
}

/** Enkel HTML-eskapering för värden som stoppas in i mallen. */
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/**
 * Bygger mejlet. Färger och avstånd INLINE — mejlklienter kastar <style>-block
 * (DE1-lärdomen 2026-09-12: knapptexten syntes knappt i första riktiga mejlet).
 * @param {{ title: string, message: string, data: Record<string, unknown> }} notis
 * @param {string} siteUrl
 */
function byggMejl(notis, siteUrl) {
  const plats = typeof notis.data?.location === 'string' ? notis.data.location : '';
  const kartlank = plats ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(plats)}` : '';
  const minVecka = `${siteUrl}/#/min-vecka`;
  const btn = 'display:inline-block;padding:12px 24px;border-radius:8px;font-weight:600;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;';
  const html = `<!doctype html><html lang="sv"><body style="margin:0;padding:24px;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1917;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:12px;padding:28px 30px;">
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#57534e;">Påminnelse</p>
    <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#1c1917;">${esc(notis.title)}</h1>
    <p style="margin:0 0 18px;font-size:16px;line-height:1.5;color:#1c1917;">${esc(notis.message)}</p>
    ${kartlank ? `<p style="margin:0 0 18px;"><a href="${esc(kartlank)}" style="color:#4f46e5;">Visa ${esc(plats)} på karta</a></p>` : ''}
    <p style="margin:0 0 8px;"><a href="${esc(minVecka)}" style="${btn}background:#4f46e5;color:#ffffff;"><span style="color:#ffffff;">Öppna Min vecka</span></a></p>
    <p style="margin:18px 0 0;font-size:13px;color:#78716c;">Kan du inte komma? Anmäl det i Min vecka så vet din konsulent. Du kan stänga av mejlpåminnelser under Inställningar i Jobin.</p>
  </div></body></html>`;
  const text = `${notis.title}\n\n${notis.message}\n${kartlank ? `\nKarta: ${kartlank}\n` : ''}\nÖppna Min vecka: ${minVecka}\n\nKan du inte komma? Anmäl det i Min vecka så vet din konsulent.`;
  return { html, text };
}

/**
 * Avgör om ett mejl ska skickas: reglaget `email_notifications` — saknad rad = aldrig
 * rört = skicka (samma tolkning som job-alerts), `false` = nej.
 * @param {{ email_notifications?: boolean | null } | null | undefined} pref
 */
function skaMejla(pref) {
  return !(pref && pref.email_notifications === false);
}

const hanterare = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!verifyCronSecret(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY saknas — kan inte läsa påminnelser.' });
  }
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  if (!resendApiKey || !emailFrom) {
    // DE2: högljutt fel, ingen sandlåda. Notiserna i portalen finns ändå.
    return res.status(500).json({ error: 'RESEND_API_KEY eller EMAIL_FROM saknas — inga påminnelsemejl skickas.' });
  }
  const siteUrl = process.env.VITE_APP_URL || 'https://www.jobin.se';
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const sedan = new Date(); sedan.setUTCHours(0, 0, 0, 0);
  const { data: notiser, error } = await supabase
    .from('notifications')
    .select('id, user_id, title, message, data, created_at')
    .eq('type', 'aktivitet_paminnelse')
    .gte('created_at', sedan.toISOString());
  if (error) return res.status(500).json({ error: `Kunde inte läsa påminnelser: ${error.message}` });

  const kandidater = (notiser || []).filter((n) => !(n.data && n.data.mail_sent));
  const utfall = { lästa: (notiser || []).length, kandidater: kandidater.length, skickade: 0, avstängda: 0, utanEpost: 0, fel: 0 };

  for (const n of kandidater) {
    const [{ data: profil }, { data: pref }] = await Promise.all([
      supabase.from('profiles').select('email, first_name').eq('id', n.user_id).maybeSingle(),
      supabase.from('user_preferences').select('email_notifications').eq('user_id', n.user_id).maybeSingle(),
    ]);
    if (!skaMejla(pref)) { utfall.avstängda++; continue; }
    const till = profil && profil.email;
    if (!till) { utfall.utanEpost++; continue; }

    const { html, text } = byggMejl(n, siteUrl);
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: emailFrom, to: [till], subject: n.title, html, text }),
      });
      if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text().catch(() => 'unknown')).slice(0, 200)}`);
      await supabase.from('notifications').update({ data: { ...(n.data || {}), mail_sent: new Date().toISOString() } }).eq('id', n.id);
      utfall.skickade++;
    } catch (e) {
      utfall.fel++;
      console.error('[pass-paminnelse] mejl misslyckades för notis', n.id, e instanceof Error ? e.message : e);
    }
  }
  return res.status(200).json(utfall);
};

module.exports = medFelrapport('pass-paminnelse', hanterare);
// Exponerat för test — Vercel anropar bara default-exporten.
module.exports.byggMejl = byggMejl;
module.exports.skaMejla = skaMejla;
module.exports.verifyCronSecret = verifyCronSecret;
