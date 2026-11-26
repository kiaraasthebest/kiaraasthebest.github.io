/**
 * The Present Tense – form backend (Netlify Function, available at /api/submit)
 *
 * Every form on the website posts JSON here: { form: "<form-name>", ...fields }.
 * This function validates the data, then uses Resend (https://resend.com) to
 *   - email the submission to the organisation's inbox, and
 *   - for sign-ups: record the person as a Resend contact and send the welcome email once.
 *
 * Secrets live ONLY in environment variables (Netlify > Site settings > Environment variables).
 * Nothing in this file or in the browser JavaScript contains a key.
 *
 *   RESEND_API_KEY   (required)  API key from Resend
 *   MAIL_FROM        (required)  e.g. "The Present Tense <hello@yourdomain.org>"  (domain verified in Resend)
 *   MAIL_TO          (required)  the organisation's inbox that receives submissions
 *   MAIL_TO_CONTACT, MAIL_TO_SUGGESTIONS, MAIL_TO_ANGEL, MAIL_TO_SUPPORTERS, MAIL_TO_SIGNUPS
 *                    (optional)  send that kind of submission to a different inbox
 *   ALLOWED_ORIGINS  (optional)  comma-separated extra site origins allowed to post here
 */

const RESEND = 'https://api.resend.com';

/* ---------- What each form may contain ---------- */
// [field, label, maxLength, required]
const FORMS = {
  contact: {
    inbox: 'CONTACT', subject: d => 'New message: ' + (d.type || 'General'),
    fields: [['type', 'Topic', 60, true], ['name', 'Name', 100, true], ['email', 'Email', 200, true], ['message', 'Message', 4000, true]],
  },
  'campaign-suggestion': {
    inbox: 'SUGGESTIONS', subject: d => 'Campaign suggestion: ' + (d.campaign || ''),
    fields: [['campaign', 'Campaign', 100, true], ['name', 'Name', 100, false], ['email', 'Email', 200, false], ['message', 'Suggestion', 4000, true]],
  },
  'general-suggestion': {
    inbox: 'SUGGESTIONS', subject: d => 'General suggestion: ' + (d.topic || 'Feedback'),
    fields: [['topic', 'About', 80, true], ['name', 'Name', 100, false], ['email', 'Email', 200, false], ['message', 'Suggestion', 4000, true]],
  },
  'angel-pledge': {
    inbox: 'ANGEL', subject: d => 'Angel Tree pledge: ' + (d.child || ''),
    fields: [['child', 'Child card', 120, true], ['method', 'How they will help', 60, true], ['items', 'Items', 1000, true], ['name', 'Name', 100, true], ['email', 'Email', 200, true]],
  },
  'supporter-consent': {
    inbox: 'SUPPORTERS', subject: d => 'Giving Wall preference from ' + (d.name || ''),
    fields: [['name', 'Name', 100, true], ['email', 'Email', 200, true], ['choice', 'Listing choice', 200, true],
             ['display_name', 'Display name', 100, false], ['photo_ok', 'Happy to share a photo', 20, false],
             ['reference', 'Contribution reference / date', 200, false], ['message', 'Notes', 2000, false]],
  },
  // Sign-ups: recorded as contacts + welcome email
  newsletter:     { inbox: 'SIGNUPS', signup: true, subject: () => 'New email sign-up', fields: [['name', 'Name', 100, false], ['email', 'Email', 200, true]] },
  'angel-signup': { inbox: 'SIGNUPS', signup: true, subject: () => 'New Angel Tree sign-up', fields: [['name', 'Name', 100, false], ['email', 'Email', 200, true]] },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ---------- Small helpers ---------- */
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const oneLine = s => String(s).replace(/[\r\n]+/g, ' ').trim().slice(0, 150);
const clean = s => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();

// Light in-memory rate limit (per warm function instance) – a speed bump for spammers, not a guarantee.
const hits = new Map();
function limited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000;
  const list = (hits.get(ip) || []).filter(t => now - t < win);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 12;
}

function originOk(req) {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    const host = new URL(origin).host;
    const mine = [new URL(req.url).host, req.headers.get('host'), req.headers.get('x-forwarded-host')].filter(Boolean);
    const extra = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean).map(o => { try { return new URL(o).host; } catch { return o; } });
    return mine.includes(host) || extra.includes(host) || host === 'localhost' || host.startsWith('localhost:');
  } catch { return false; }
}

async function resend(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(RESEND + path, {
    method,
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null; try { data = await res.json(); } catch { /* empty body */ }
  return { ok: res.ok, status: res.status, data };
}

async function sendMail({ to, subject, html, text, replyTo, idempotencyKey }) {
  const r = await resend('/emails', {
    method: 'POST',
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
    body: { from: process.env.MAIL_FROM, to: [to], subject: oneLine(subject), html, text, ...(replyTo ? { reply_to: replyTo } : {}) },
  });
  if (!r.ok) console.error('Resend email failed', r.status, JSON.stringify(r.data));
  return r.ok;
}

/* ---------- Email bodies ---------- */
function notificationEmail(def, data, formName) {
  const rows = def.fields.filter(([k]) => data[k]);
  const html = `<h2 style="font-family:Georgia,serif;color:#0F4C4A">${esc(oneLine(def.subject(data)))}</h2>
<table cellpadding="8" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:15px">
${rows.map(([k, label]) => `<tr><td style="vertical-align:top;font-weight:bold;border-bottom:1px solid #ddd">${esc(label)}</td><td style="border-bottom:1px solid #ddd;white-space:pre-wrap">${esc(data[k])}</td></tr>`).join('')}
</table><p style="font-family:Arial,sans-serif;font-size:12px;color:#666">Sent from the ${esc(formName)} form on the website.</p>`;
  const text = rows.map(([k, label]) => `${label}: ${data[k]}`).join('\n') + `\n\n(Sent from the ${formName} form on the website.)`;
  return { html, text };
}

function welcomeEmail(name) {
  const dear = name ? `Dear ${name},` : 'Dear friend,';
  const paras = [
    'Thank you for joining The Present Tense!',
    'We are so glad to have you as part of our growing community. By signing up, you’ve taken the first step towards helping us make celebrations, special moments and meaningful giving possible throughout the year.',
    'We’ll keep you updated on our upcoming initiatives, seasonal campaigns, opportunities to get involved and the difference we’re making together.',
    'Thank you for being part of something that believes in the power of giving, in every season.',
    'There’s no tense like The Present Tense.',
  ];
  const text = [dear, ...paras, 'Warm regards,\nThe Present Tense Team'].join('\n\n');
  const p = t => `<p style="margin:0 0 16px">${esc(t)}</p>`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#0F4C4A;max-width:560px">
${p(dear)}${paras.map(p).join('')}<p style="margin:0">Warm regards,<br>The Present Tense Team</p></div>`;
  return { html, text, subject: 'Thank You for Joining The Present Tense!' };
}

/* ---------- Handler ---------- */
export default async (req, context) => {
  if (req.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed.' });
  if (!originOk(req)) return json(403, { ok: false, error: 'This request was not allowed.' });

  const ip = context?.ip || req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'unknown';
  if (limited(ip)) return json(429, { ok: false, error: 'Too many submissions. Please wait a few minutes and try again.' });

  let body;
  try { body = await req.json(); } catch { return json(400, { ok: false, error: 'We could not read that submission.' }); }
  if (!body || typeof body !== 'object') return json(400, { ok: false, error: 'We could not read that submission.' });

  const formName = String(body.form || '');
  const def = Object.prototype.hasOwnProperty.call(FORMS, formName) ? FORMS[formName] : null;
  if (!def) return json(400, { ok: false, error: 'Unknown form.' });

  const { RESEND_API_KEY, MAIL_FROM } = process.env;
  const inbox = process.env['MAIL_TO_' + def.inbox] || process.env.MAIL_TO;
  if (!RESEND_API_KEY || !MAIL_FROM || !inbox) {
    console.error('Email is not configured: set RESEND_API_KEY, MAIL_FROM and MAIL_TO.');
    return json(503, { ok: false, error: 'This form is not set up yet. Please try again later.' });
  }

  // Validate + sanitise only the fields this form allows
  const data = {};
  for (const [key, label, max, required] of def.fields) {
    let v = body[key];
    if (typeof v !== 'string') v = v == null ? '' : String(v);
    v = clean(v);
    if (required && !v) return json(422, { ok: false, error: `Please fill in: ${label}.` });
    if (v.length > max) return json(422, { ok: false, error: `${label} is too long.` });
    data[key] = v;
  }
  if (data.email) {
    data.email = data.email.toLowerCase();
    if (!EMAIL_RE.test(data.email)) return json(422, { ok: false, error: 'Please enter a valid email address.' });
  }

  /* ----- Sign-ups: record, then welcome (once) ----- */
  if (def.signup) {
    const email = data.email;
    const firstName = data.name.split(/\s+/)[0] || '';

    const existing = await resend('/contacts/' + encodeURIComponent(email));
    if (existing.ok) return json(200, { ok: true, status: 'already' });          // already signed up: no second welcome email
    if (existing.status !== 404) {
      console.error('Contact lookup failed', existing.status, JSON.stringify(existing.data));
      return json(502, { ok: false, error: 'We could not complete your sign-up. Please try again.' });
    }

    const created = await resend('/contacts', {
      method: 'POST',
      body: { email, first_name: firstName || undefined, last_name: data.name.split(/\s+/).slice(1).join(' ') || undefined, unsubscribed: false },
    });
    if (!created.ok) {
      console.error('Contact create failed', created.status, JSON.stringify(created.data));
      return json(502, { ok: false, error: 'We could not complete your sign-up. Please try again.' });
    }

    const w = welcomeEmail(firstName);
    const sent = await sendMail({ to: email, subject: w.subject, html: w.html, text: w.text, idempotencyKey: 'welcome-' + email });
    if (!sent) {
      // Roll back so the person can simply try again (and still gets exactly one welcome email).
      await resend('/contacts/' + encodeURIComponent(email), { method: 'DELETE' });
      return json(502, { ok: false, error: 'We could not send your confirmation email. Please check the address and try again.' });
    }

    // Tell the organisation (best effort)
    const n = notificationEmail(def, data, formName);
    await sendMail({ to: inbox, subject: def.subject(data), html: n.html, text: n.text });
    return json(200, { ok: true, status: 'subscribed' });
  }

  /* ----- Everything else: deliver to the organisation inbox ----- */
  const n = notificationEmail(def, data, formName);
  const delivered = await sendMail({ to: inbox, subject: def.subject(data), html: n.html, text: n.text, replyTo: data.email || undefined });
  if (!delivered) return json(502, { ok: false, error: 'Your message could not be delivered. Please try again.' });
  return json(200, { ok: true });
};

export const config = { path: '/api/submit' };
