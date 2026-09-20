/**
 * KM10-resten — mejl för konsulentens notiser om deltagarens vecka
 * ("mejlnotiser när DE1 är löst", ROADMAP §KM "Kvar i spåret" punkt 2).
 *
 * `services/aktivitetNotiser.ts` skriver tre notistyper till `notifications`
 * när konsulenten planerar veckan, ändrar ett pass eller markerar ogiltig
 * frånvaro — hittills bara i appen, eftersom DE1 (Resend/DNS) blockerade all
 * utgående e-post från jobin.se. DE1 är löst sedan 2026-09-12; den här
 * funktionen är den mejlväg som saknades, byggd efter exakt samma mönster
 * som `pass-paminnelse.js` (F3): läs olästa notiser (`data.mail_sent`
 * saknas), slå upp mottagarens e-post och `user_preferences
 * .email_notifications`, skicka via Resend, markera `data.mail_sent`.
 * Idempotent: en körning till skickar inget en andra gång.
 *
 * Fönstret är satt till 3 dygn (inte "i dag" som pass-paminnelse) eftersom
 * de här notiserna skapas ad hoc av en konsulent under kontorstid, inte av
 * ett schemalagt databasjobb vid en fast tidpunkt — en notis från i går
 * kväll ska fortfarande fångas av morgondagens körning.
 *
 * Kräver CRON_SECRET, RESEND_API_KEY, EMAIL_FROM — se pass-paminnelse.js.
 *
 * UTLÖSARE SAKNAS MED FLIT: raden i client/vercel.json `crons` kräver
 * Mikaels ja, precis som för pass-paminnelse:
 *   { "path": "/api/aktivitet-mejl", "schedule": "0 17 * * *" }
 * (17:00 UTC, en halvtimme före pass-paminnelses 17:30.)
 */
const { createClient } = require('@supabase/supabase-js');
const { medFelrapport, skickaHandelse } = require('./_utils/sentry.js');
const { avgorSvar } = require('./_utils/mejlutfall.js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// Service role krävs: notifications och profiles läses för andra användare.
// Faller ALDRIG tillbaka på anon-nyckeln — RLS hade gett tomma svar som såg
// ut som "inga notiser i dag" (samma lärdom som pass-paminnelse/job-alerts).
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const TYPER = ['aktivitet_plan', 'aktivitet_pass', 'aktivitet_franvaro'];
const FONSTER_DYGN = 3;

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
 * Bygger mejlet. Färger inline — mejlklienter kastar <style>-block (samma
 * DE1-lärdom som pass-paminnelse).
 * @param {{ title: string, message: string }} notis
 * @param {string} siteUrl
 */
function byggMejl(notis, siteUrl) {
  const minVecka = `${siteUrl}/#/min-vecka`;
  const btn = 'display:inline-block;padding:12px 24px;border-radius:8px;font-weight:600;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;';
  const html = `<!doctype html><html lang="sv"><body style="margin:0;padding:24px;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1917;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:12px;padding:28px 30px;">
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#57534e;">Din vecka</p>
    <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#1c1917;">${esc(notis.title)}</h1>
    <p style="margin:0 0 18px;font-size:16px;line-height:1.5;color:#1c1917;">${esc(notis.message)}</p>
    <p style="margin:0 0 8px;"><a href="${esc(minVecka)}" style="${btn}background:#4f46e5;color:#ffffff;"><span style="color:#ffffff;">Öppna Min vecka</span></a></p>
    <p style="margin:18px 0 0;font-size:13px;color:#78716c;">Frågor om planen? Prata med din konsulent. Du kan stänga av mejlnotiser under Inställningar i Jobin.</p>
  </div></body></html>`;
  const text = `${notis.title}\n\n${notis.message}\n\nÖppna Min vecka: ${minVecka}\n\nFrågor om planen? Prata med din konsulent.`;
  return { html, text };
}

/**
 * Avgör om ett mejl ska skickas: reglaget `email_notifications` — saknad rad = aldrig
 * rört = skicka (samma tolkning som job-alerts/pass-paminnelse), `false` = nej.
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
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY saknas — kan inte läsa notiser.' });
  }
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  if (!resendApiKey || !emailFrom) {
    // DE2: högljutt fel, ingen sandlåda. Notiserna i portalen finns ändå.
    return res.status(500).json({ error: 'RESEND_API_KEY eller EMAIL_FROM saknas — inga notismejl skickas.' });
  }
  const siteUrl = process.env.VITE_APP_URL || 'https://www.jobin.se';
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const sedan = new Date(Date.now() - FONSTER_DYGN * 24 * 60 * 60 * 1000);
  const { data: notiser, error } = await supabase
    .from('notifications')
    .select('id, user_id, title, message, data, created_at')
    .in('type', TYPER)
    .gte('created_at', sedan.toISOString());
  if (error) return res.status(500).json({ error: `Kunde inte läsa notiser: ${error.message}` });

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
      console.error('[aktivitet-mejl] mejl misslyckades för notis', n.id, e instanceof Error ? e.message : e);
    }
  }
  // DR2: statuskoden är det enda Vercel Cron läser. Föll varenda
  // utskick är det vägen ut som är trasig, inte mottagarna — då ska
  // körningen synas som misslyckad, inte som en tyst grön natt.
  const svar = avgorSvar(utfall);
  if (svar.larm) {
    console.error('[aktivitet-mejl]', svar.larm);
    if (svar.status < 500) {
      // 5xx rapporteras redan av medFelrapport(); delvisa fel gör det inte.
      await skickaHandelse({ funktion: 'aktivitet-mejl', typ: 'MejlutskickDelvisFel', meddelande: svar.larm });
    }
  }
  return res.status(svar.status).json(utfall);
};

module.exports = medFelrapport('aktivitet-mejl', hanterare);
// Exponerat för test — Vercel anropar bara default-exporten.
module.exports.byggMejl = byggMejl;
module.exports.skaMejla = skaMejla;
module.exports.verifyCronSecret = verifyCronSecret;
