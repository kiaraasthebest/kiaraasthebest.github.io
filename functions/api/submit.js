
/**
 * The Present Tense – Cloudflare Pages Function
 * Endpoint: /api/submit
 *
 * Environment variables:
 * RESEND_API_KEY
 * MAIL_FROM
 * MAIL_TO
 * Optional:
 * MAIL_TO_CONTACT
 * MAIL_TO_SUGGESTIONS
 * MAIL_TO_ANGEL
 * MAIL_TO_SUPPORTERS
 * MAIL_TO_SIGNUPS
 * ALLOWED_ORIGINS
 */

const RESEND = 'https://api.resend.com';

const FORMS = {
  contact: {
    inbox: 'CONTACT',
    subject: d => 'New message: ' + (d.type || 'General'),
    fields: [
      ['type', 'Topic', 60, true],
      ['name', 'Name', 100, true],
      ['email', 'Email', 200, true],
      ['message', 'Message', 4000, true],
    ],
  },

  'campaign-suggestion': {
    inbox: 'SUGGESTIONS',
    subject: d => 'Campaign suggestion: ' + (d.campaign || ''),
    fields: [
      ['campaign', 'Campaign', 100, true],
      ['name', 'Name', 100, false],
      ['email', 'Email', 200, false],
      ['message', 'Suggestion', 4000, true],
    ],
  },

  'general-suggestion': {
    inbox: 'SUGGESTIONS',
    subject: d => 'General suggestion: ' + (d.topic || 'Feedback'),
    fields: [
      ['topic', 'About', 80, true],
      ['name', 'Name', 100, false],
      ['email', 'Email', 200, false],
      ['message', 'Suggestion', 4000, true],
    ],
  },

  'angel-pledge': {
    inbox: 'ANGEL',
    subject: d => 'Angel Tree pledge: ' + (d.child || ''),
    fields: [
      ['child', 'Child card', 120, true],
      ['method', 'How they will help', 60, true],
      ['items', 'Items', 1000, true],
      ['name', 'Name', 100, true],
      ['email', 'Email', 200, true],
    ],
  },

  'supporter-consent': {
    inbox: 'SUPPORTERS',
    subject: d => 'Giving Wall preference from ' + (d.name || ''),
    fields: [
      ['name', 'Name', 100, true],
      ['email', 'Email', 200, true],
      ['choice', 'Listing choice', 200, true],
      ['display_name', 'Display name', 100, false],
      ['photo_ok', 'Happy to share a photo', 20, false],
      ['reference', 'Contribution reference / date', 200, false],
      ['message', 'Notes', 2000, false],
    ],
  },

  newsletter: {
    inbox: 'SIGNUPS',
    signup: true,
    subject: () => 'New email sign-up',
    fields: [
      ['name', 'Name', 100, false],
      ['email', 'Email', 200, true],
    ],
  },

  'angel-signup': {
    inbox: 'SIGNUPS',
    signup: true,
    subject: () => 'New Angel Tree sign-up',
    fields: [
      ['name', 'Name', 100, false],
      ['email', 'Email', 200, true],
    ],
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

const esc = s =>
  String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));

const oneLine = s =>
  String(s).replace(/[\r\n]+/g, ' ').trim().slice(0, 150);

const clean = s =>
  String(s ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();

// Basic in-memory rate limit.
// This is a speed bump, not permanent or distributed protection.
const hits = new Map();

function limited(ip) {
  const now = Date.now();
  const win = 10 * 60 * 1000;
  const list = (hits.get(ip) || []).filter(t => now - t < win);

  list.push(now);
  hits.set(ip, list);

  if (hits.size > 5000) hits.clear();

  return list.length > 12;
}

function originOk(request, env) {
  const origin = request.headers.get('origin');

  if (!origin) return true;

  try {
    const host = new URL(origin).host;
    const ownHost = new URL(request.url).host;

    const extra = (env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(o => {
        try {
          return new URL(o).host;
        } catch {
          return o;
        }
      });

    return (
      host === ownHost ||
      extra.includes(host) ||
      host === 'localhost' ||
      host.startsWith('localhost:')
    );
  } catch {
    return false;
  }
}

async function resend(path, env, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
  } = options;

  const response = await fetch(RESEND + path, {
    method,
    headers: {
      Authorization: 'Bearer ' + env.RESEND_API_KEY,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    // Empty response body.
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

async function sendMail(env, {
  to,
  subject,
  html,
  text,
  replyTo,
  idempotencyKey,
}) {
  const r = await resend('/emails', env, {
    method: 'POST',
    headers: idempotencyKey
      ? { 'Idempotency-Key': idempotencyKey }
      : {},
    body: {
      from: env.MAIL_FROM,
      to: [to],
      subject: oneLine(subject),
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    },
  });

  if (!r.ok) {
    console.error('Resend email failed', r.status, r.data);
  }

  return r.ok;
}

function notificationEmail(def, data, formName) {
  const rows = def.fields.filter(([key]) => data[key]);

  const html = `
    <h2 style="font-family:Georgia,serif;color:#0F4C4A">
      ${esc(oneLine(def.subject(data)))}
    </h2>
    <table cellpadding="8" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:15px">
      ${rows.map(([key, label]) => `
        <tr>
          <td style="vertical-align:top;font-weight:bold;border-bottom:1px solid #ddd">
            ${esc(label)}
          </td>
          <td style="border-bottom:1px solid #ddd;white-space:pre-wrap">
            ${esc(data[key])}
          </td>
        </tr>
      `).join('')}
    </table>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#666">
      Sent from the ${esc(formName)} form on the website.
    </p>
  `;

  const text = rows
    .map(([key, label]) => `${label}: ${data[key]}`)
    .join('\n') +
    `\n\n(Sent from the ${formName} form on the website.)`;

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

  const text = [
    dear,
    ...paras,
    'Warm regards,\nThe Present Tense Team',
  ].join('\n\n');

  const p = t => `<p style="margin:0 0 16px">${esc(t)}</p>`;

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#0F4C4A;max-width:560px">
      ${p(dear)}
      ${paras.map(p).join('')}
      <p style="margin:0">Warm regards,<br>The Present Tense Team</p>
    </div>
  `;

  return {
    html,
    text,
    subject: 'Thank You for Joining The Present Tense!',
  };
}

/* ---------- Cloudflare Pages handler ---------- */

export async function onRequestPost({ request, env }) {
  if (!originOk(request, env)) {
    return json(403, {
      ok: false,
      error: 'This request was not allowed.',
    });
  }

  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    'unknown';

  if (limited(ip)) {
    return json(429, {
      ok: false,
      error: 'Too many submissions. Please wait a few minutes and try again.',
    });
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json(400, {
      ok: false,
      error: 'We could not read that submission.',
    });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json(400, {
      ok: false,
      error: 'We could not read that submission.',
    });
  }

  const formName = String(body.form || '');

  const def = Object.prototype.hasOwnProperty.call(FORMS, formName)
    ? FORMS[formName]
    : null;

  if (!def) {
    return json(400, {
      ok: false,
      error: 'Unknown form.',
    });
  }

  const inbox =
    env['MAIL_TO_' + def.inbox] ||
    env.MAIL_TO;

  if (!env.RESEND_API_KEY || !env.MAIL_FROM || !inbox) {
    console.error(
      'Email is not configured: set RESEND_API_KEY, MAIL_FROM and MAIL_TO.'
    );

    return json(503, {
      ok: false,
      error: 'This form is not set up yet. Please try again later.',
    });
  }

  // Validate and sanitise the fields allowed for this form.
  const data = {};

  for (const [key, label, max, required] of def.fields) {
    let value = body[key];

    if (typeof value !== 'string') {
      value = value == null ? '' : String(value);
    }

    value = clean(value);

    if (required && !value) {
      return json(422, {
        ok: false,
        error: `Please fill in: ${label}.`,
      });
    }

    if (value.length > max) {
      return json(422, {
        ok: false,
        error: `${label} is too long.`,
      });
    }

    data[key] = value;
  }

  if (data.email) {
    data.email = data.email.toLowerCase();

    if (!EMAIL_RE.test(data.email)) {
      return json(422, {
        ok: false,
        error: 'Please enter a valid email address.',
      });
    }
  }

  /* ----- Sign-ups: record contact, then send welcome email ----- */

  if (def.signup) {
    const email = data.email;
    const firstName = data.name.split(/\s+/)[0] || '';

    const existing = await resend(
      '/contacts/' + encodeURIComponent(email),
      env
    );

    if (existing.ok) {
      return json(200, {
        ok: true,
        status: 'already',
      });
    }

    if (existing.status !== 404) {
      console.error(
        'Contact lookup failed',
        existing.status,
        existing.data
      );

      return json(502, {
        ok: false,
        error: 'We could not complete your sign-up. Please try again.',
      });
    }

    const created = await resend('/contacts', env, {
      method: 'POST',
      body: {
        email,
        first_name: firstName || undefined,
        last_name:
          data.name.split(/\s+/).slice(1).join(' ') || undefined,
        unsubscribed: false,
      },
    });

    if (!created.ok) {
      console.error(
        'Contact create failed',
        created.status,
        created.data
      );

      return json(502, {
        ok: false,
        error: 'We could not complete your sign-up. Please try again.',
      });
    }

    const welcome = welcomeEmail(firstName);

    const sent = await sendMail(env, {
      to: email,
      subject: welcome.subject,
      html: welcome.html,
      text: welcome.text,
      idempotencyKey: 'welcome-' + email,
    });

    if (!sent) {
      await resend(
        '/contacts/' + encodeURIComponent(email),
        env,
        { method: 'DELETE' }
      );

      return json(502, {
        ok: false,
        error: 'We could not send your confirmation email. Please check the address and try again.',
      });
    }

    // Notify the organisation as well.
    const notification = notificationEmail(def, data, formName);

    await sendMail(env, {
      to: inbox,
      subject: def.subject(data),
      html: notification.html,
      text: notification.text,
    });

    return json(200, {
      ok: true,
      status: 'subscribed',
    });
  }

  /* ----- All other forms: email the organisation ----- */

  const notification = notificationEmail(def, data, formName);

  const delivered = await sendMail(env, {
    to: inbox,
    subject: def.subject(data),
    html: notification.html,
    text: notification.text,
    replyTo: data.email || undefined,
  });

  if (!delivered) {
    return json(502, {
      ok: false,
      error: 'Your message could not be delivered. Please try again.',
    });
  }

  return json(200, { ok: true });
}
