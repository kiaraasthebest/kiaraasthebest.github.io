
/* ===== Form settings =====
   All website forms submit to Formspree.
   EmailJS sends newsletter and Contact Us confirmation emails.
   The EmailJS public key is intended for browser use;
   never put a private key here. */

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mppdnnbq";
const EMAILJS_SERVICE_ID = "service_uw8l4hy";
const EMAILJS_TEMPLATE_ID = "template_3j1521f";
const EMAILJS_CONTACT_TEMPLATE_ID = "template_rvjid5x";
const EMAILJS_PUBLIC_KEY = "Kd3Tiztcp2LQ6O53N";

const GOFUNDME_URL = "PASTE_YOUR_GOFUNDME_URL_HERE";
const WHATSAPP_NUMBER = "264000000000";
const NEXT_CAMPAIGN = { name: "Valentine's Day", date: "2027-02-14" };
const PAY_INFO = "We'll email you how to pay shortly. Thank you!";


/* ===== Angel Tree children: add real cards here =====
   Share a first name and age only: no photos or surnames,
   and only with guardian consent.
   Prices are rough ranges in Namibian dollars.
   Remove "example: true" for real cards. */

const CHILDREN = [
  {
    id: "example",
    example: true,
    name: "Tomas",
    age: 7,
    drop: "Drop-off location to be announced",
    needs: [
      { n: "Bedding set", lo: 250, hi: 400 },
      { n: "Socks (3 pairs)", lo: 60, hi: 100 },
      { n: "School shoes", lo: 300, hi: 500 }
    ],
    wants: [
      { n: "Toy car", lo: 80, hi: 150 },
      { n: "Picture book", lo: 70, hi: 120 }
    ]
  }
];


/* ===== Helpers ===== */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const isUrl = (u) => /^https?:\/\//i.test(u || '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^\p{L}[\p{L}\s'’.-]*$/u;

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

const range = (i) => `N$${i.lo}–${i.hi}`;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

const host = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return u;
  }
};

const initial = (n) => esc((String(n).trim()[0] || '♥').toUpperCase());
const para = (arr) => arr.map(t => `<p>${esc(t)}</p>`).join('');
const slugOk = (s) => encodeURIComponent(s);

const placeholderChip = (x) =>
  x.placeholder
    ? '<span class="chip placeholder">Placeholder: replace with real details</span>'
    : '';


/* ===== EmailJS loader ===== */

function loadEmailJS() {
  if (window.emailjs) return Promise.resolve(window.emailjs);

  if (window._emailJsLoading) return window._emailJsLoading;

  window._emailJsLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');

    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';

    script.onload = () => {
      if (!window.emailjs) {
        return reject(new Error('The email service could not be loaded.'));
      }

      window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
      resolve(window.emailjs);
    };

    script.onerror = () =>
      reject(new Error('The email service could not be loaded.'));

    document.head.appendChild(script);
  });

  return window._emailJsLoading;
}


/* ===== Formspree submission ===== */

async function send(form, data) {
  let res;

  try {
    res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        ...data,
        form_type: form,
        _subject: `The Present Tense – ${form}`
      })
    });
  } catch (e) {
    throw new Error("We couldn't reach the server. Please check your connection and try again.");
  }

  let body = {};

  try {
    body = await res.json();
  } catch {
    /* Not JSON */
  }

  if (!res.ok) {
    throw new Error(
      body.errors?.[0]?.message ||
      'Something went wrong. Please try again.'
    );
  }

  return body;
}


function say(el, text, type = '') {
  el.textContent = text;
  el.className = 'status ' + type;
}


/* ===== Mobile menu ===== */

const nav = $('#nav');
const toggle = $('.toggle');

toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});


/* ===== Wishlist progress bars ===== */

function buildWish(root = document) {
  $$('.wish li', root).forEach(li => {
    if (li.querySelector('.track')) return;

    const have = Number(li.dataset.have) || 0;
    const goal = Number(li.dataset.goal) || 0;
    const name = esc(li.textContent.trim());

    const pct = goal
      ? Math.min(100, Math.round(have / goal * 100))
      : 0;

    li.innerHTML =
      `<span class="row"><span>${name}</span><span>${have} of ${goal}</span></span>` +
      `<span class="track" role="progressbar" aria-label="${name}" aria-valuemin="0" aria-valuemax="${goal}" aria-valuenow="${have}">` +
      `<span class="fill" style="width:${pct}%"></span></span>`;
  });
}

buildWish();


/* ===== GoFundMe buttons ===== */

function wireGoFundMe(root = document) {
  $$('[data-gofundme]', root).forEach(a => {
    if (isUrl(GOFUNDME_URL)) {
      a.href = GOFUNDME_URL;
      a.target = '_blank';
      a.rel = 'noopener';
      return;
    }

    a.href = '#contact';
    a.removeAttribute('target');
    a.dataset.type = 'Donations';
  });
}

wireGoFundMe();


/* ===== Page content built from content.js ===== */


/* --- Seasonal campaign cards --- */

function renderCampaignCards() {
  $$('[data-campaign-cards]').forEach(box => {
    box.innerHTML = CAMPAIGNS.map(c => `
      <article class="card camp-card theme-${esc(c.theme)}">
        ${c.image
          ? `<img class="camp-img" src="${esc(c.image)}" alt="">`
          : `<div class="camp-banner" aria-hidden="true">${c.emoji}</div>`}
        <span class="chip">${esc(c.status)}</span>
        <h3><a class="stretch" href="#campaign/${slugOk(c.id)}">${esc(c.name)}</a></h3>
        <p>${esc(c.blurb)}</p>
        <span class="btn btn-ink btn-sm">View campaign</span>
      </article>
    `).join('');
  });
}


/* --- Founders --- */

function renderFounders() {
  $$('[data-founders]').forEach(box => {
    box.innerHTML = FOUNDERS.slice(0, 2).map(f => `
      <article class="founder acc-${esc(f.accent || 'pink')}">
        ${f.photo
          ? `<img class="founder-photo" src="${esc(f.photo)}" alt="Photograph of ${esc(f.name)}">`
          : '<div class="img tall arch founder-photo" role="img" aria-label="Photograph to be added"></div>'}
        <div class="founder-body">
          ${placeholderChip(f)}
          <h3>${esc(f.name)}</h3>
          <p class="role">${esc(f.role)}</p>
          ${f.quote ? `<blockquote class="script">“${esc(f.quote)}”</blockquote>` : ''}
          <h4>Who I am</h4>
          <p>${esc(f.intro)}</p>
          <h4>Why The Present Tense</h4>
          ${para(f.story)}
        </div>
      </article>
    `).join('');
  });
}


/* --- Ambassadors --- */

function renderAmbassadors() {
  $$('[data-ambassadors]').forEach(box => {
    const cards = AMBASSADORS.map(a => `
      <article class="amb">
        ${a.photo
          ? `<img class="amb-photo" src="${esc(a.photo)}" alt="Profile photo of ${esc(a.name)}">`
          : `<span class="amb-photo amb-initial" aria-hidden="true">${initial(a.name)}</span>`}
        ${placeholderChip(a)}
        <h3>${esc(a.name)}</h3>
        <p>${esc(a.about)}</p>
        ${isUrl(a.link)
          ? `<a class="btn btn-ink btn-sm" href="${esc(a.link)}" target="_blank" rel="noopener noreferrer">${esc(a.linkLabel || 'View on social media')} ↗</a>`
          : '<span class="small">Social media link to be added</span>'}
      </article>
    `).join('');

    box.innerHTML = `
      <h2 class="sec">Our ambassadors</h2>
      <p class="lead">Content creators, social media personalities and public voices who have covered, promoted or supported The Present Tense. They help us reach a wider audience and spread awareness of what we do. Thank you!</p>
      <div class="amb-grid">${cards}</div>
      <p class="note-line small">Photos are shown only with the ambassador's permission. Would you like to help spread the word? <a href="#contact" data-type="Ambassador">Get in touch.</a></p>
    `;
  });
}


/* --- Partners and sponsors --- */

function renderPartners() {
  const logo = (s, dup) =>
    `<a class="p-logo" href="#sponsor/${slugOk(s.id)}" aria-label="About ${esc(s.name)}"${dup ? ' aria-hidden="true" tabindex="-1"' : ''}>` +
    `${s.image ? `<img src="${esc(s.image)}" alt="">` : esc(s.logo)}</a>`;

  const row = (order, rev) => {
    const set = dup => order.map(i => logo(SPONSORS[i], dup)).join('');

    return `<div class="circles${rev ? ' rev' : ''}"><div class="circles-track">${set(false)}${calm ? '' : set(true)}</div></div>`;
  };

  const order = SPONSORS.map((_, i) => i);
  const shifted = order.map(i => (i + 2) % order.length);

  $$('[data-partners]').forEach(box => {
    box.innerHTML =
      `<div class="partners-panel"><h2 class="sec">Our partners and sponsors</h2>` +
      `${row(order, false)}${row(shifted, true)}<p class="p-hint">Tap a logo or name to learn more</p>` +
      `<ul class="p-names">${SPONSORS.map(s => `<li><a href="#sponsor/${slugOk(s.id)}">${esc(s.name)}</a></li>`).join('')}</ul></div>`;
  });
}


/* --- Giving Wall --- */

function renderWall() {
  const box = $('#wall');
  if (!box) return;

  const list = SUPPORTERS
    .filter(s =>
      s &&
      s.consent === true &&
      s.verified === true &&
      Number.isFinite(s.total) &&
      s.total > 0
    )
    .sort((a, b) => b.total - a.total);

  if (!list.length) {
    box.innerHTML = `
      <div class="empty">
        <h3>The wall is waiting for its first supporters</h3>
        <p>Supporters appear here only once their contribution has been verified and they have given us permission. Check back soon.</p>
        <a href="#giving" class="btn btn-ink btn-sm">See how to give</a>
      </div>
    `;
    return;
  }

  let rank = 0;
  let prev = null;

  const rows = list.map((s, i) => {
    if (s.total !== prev) {
      rank = i + 1;
      prev = s.total;
    }

    const anon = s.anonymous === true;
    const name = anon ? 'Anonymous supporter' : (s.displayName || 'Supporter');

    const pic = !anon && s.photo
      ? `<img class="wall-pic" src="${esc(s.photo)}" alt="Photo of ${esc(name)}">`
      : `<span class="wall-pic wall-initial" aria-hidden="true">${anon ? '♥' : initial(name)}</span>`;

    const amount = s.showAmount === true
      ? `N$${Number(s.total).toLocaleString('en-ZA')}`
      : 'Amount kept private';

    return `
      <li class="wall-row${rank <= 3 ? ' top top-' + rank : ''}">
        <span class="wall-rank" aria-label="Position ${rank}">${rank}</span>
        ${pic}
        <span class="wall-name">${esc(name)}</span>
        <span class="wall-amt">${amount}</span>
      </li>
    `;
  }).join('');

  box.innerHTML = `
    <ol class="wall">${rows}</ol>
    <p class="note-line small">Ranked by verified contributions only. Updated as contributions are received and confirmed.</p>
  `;
}


/* --- Charities We Support --- */

function renderCharities() {
  const box = $('#charity-list');
  if (!box) return;

  if (!CHARITIES.length) {
    box.innerHTML = `
      <div class="empty">
        <h3>Charities will be listed here</h3>
        <p>We only list charities we have actually supported or formally confirmed as beneficiaries. As soon as our first donation is made, you'll see the charity here with the details of its work.</p>
      </div>
    `;
    return;
  }

  box.innerHTML = '<div class="cards two charities">' + CHARITIES.map(c => {
    const block = (h, t) => t ? `<h4>${h}</h4><p>${esc(t)}</p>` : '';

    const links = [
      isUrl(c.website)
        ? `<a class="btn btn-ink btn-sm" href="${esc(c.website)}" target="_blank" rel="noopener noreferrer">Visit ${esc(c.name)} ↗</a>`
        : '',

      isUrl(c.contactUrl)
        ? `<a class="btn btn-sun btn-sm" href="${esc(c.contactUrl)}" target="_blank" rel="noopener noreferrer">Contact page ↗</a>`
        : '',

      EMAIL_RE.test(c.contactEmail || '')
        ? `<a class="btn btn-sun btn-sm" href="mailto:${esc(c.contactEmail)}">${esc(c.contactEmail)}</a>`
        : '',

      c.contactPhone
        ? `<a class="btn btn-sun btn-sm" href="tel:${esc(String(c.contactPhone).replace(/[^\d+]/g, ''))}">${esc(c.contactPhone)}</a>`
        : ''
    ].join('');

    return `
      <article class="card charity">
        <div class="charity-head">
          <span class="p-logo big">
            ${c.image
              ? `<img src="${esc(c.image)}" alt="${esc(c.name)} logo">`
              : esc(c.logo || initial(c.name))}
          </span>
          <h3>${esc(c.name)}</h3>
        </div>
        ${block('About', c.about)}
        ${block('Causes and communities', c.causes)}
        ${block('Their work', c.work)}
        ${block('How The Present Tense helps', c.support)}
        <div class="btn-row">${links}</div>
        <p class="small">Independent organisation. Contact them directly through their own official channels.</p>
      </article>
    `;
  }).join('') + '</div>';
}


renderCampaignCards();
renderFounders();
renderAmbassadors();
renderPartners();
renderWall();
renderCharities();


/* ===== Dynamic pages: seasonal campaigns and sponsor profiles ===== */

function renderCampaign(page, id) {
  const c = CAMPAIGNS.find(x => x.id === id);
  if (!c) return false;

  const ways = c.ways || DEFAULT_WAYS;

  const wayBtn = w => {
    if (!w.btn) return '';

    if (w.gofundme) {
      return `<a data-gofundme class="btn btn-sun btn-sm" target="_blank" rel="noopener">${esc(w.btn)}</a>`;
    }

    if (w.share) {
      return `<a class="share btn btn-topaz btn-sm" target="_blank" rel="noopener">${esc(w.btn)}</a>`;
    }

    return `<a href="${esc(w.href || '#contact')}" class="btn btn-ink btn-sm"${w.type ? ` data-type="${esc(w.type)}"` : ''}>${esc(w.btn)}</a>`;
  };

  const needs = c.needs && c.needs.length
    ? `<ul class="wish camp-wish">${c.needs.map(n => `<li data-have="${Number(n.have) || 0}" data-goal="${Number(n.goal) || 0}">${esc(n.n)}</li>`).join('')}</ul>`
    : `
      <div class="empty">
        <h3>Needs list coming soon</h3>
        <p>${esc(c.needsNote || "We'll publish the list of items and donations needed here once this campaign's plans are confirmed.")}</p>
        ${c.needsLink
          ? `<a class="btn btn-ink btn-sm" href="${esc(c.needsLink.href)}">${esc(c.needsLink.label)}</a>`
          : '<a href="#contact" class="btn btn-ink btn-sm" data-type="Donations">Ask how you can help now</a>'}
      </div>
    `;

  const updates = c.updates && c.updates.length
    ? `<ol class="updates">${c.updates.map(u => `<li><time>${esc(u.date)}</time><h3>${esc(u.title)}</h3><p>${esc(u.text)}</p></li>`).join('')}</ol>`
    : `
      <div class="empty">
        <h3>No updates yet</h3>
        <p>Progress, photos and results will be posted here as the campaign moves forward.</p>
        <button type="button" class="btn btn-ink btn-sm" data-scroll="news-email">Get updates by email</button>
      </div>
    `;

  page.innerHTML = `
    <section class="camp-hero theme-${esc(c.theme)}">
      <a class="back" href="#giving">← All campaigns</a>
      <span class="camp-emoji" aria-hidden="true">${c.emoji}</span>
      <span class="chip">${esc(c.status)}</span>
      <h1 class="pg-title">${esc(c.name)}</h1>
      <p class="camp-sub">${esc(c.blurb)}</p>
      <div class="btn-row center">
        <button type="button" class="btn btn-ink" data-scroll="camp-how">How to help</button>
        <button type="button" class="btn btn-sun" data-scroll="camp-ideas">Share an idea</button>
      </div>
    </section>

    <section class="sect" id="camp-about">
      <div class="narrow wide">
        <h2 class="sec left">About this initiative</h2>
        ${para(c.about)}
        ${c.related ? `<div class="btn-row"><a class="btn btn-ink btn-sm" href="${esc(c.related.href)}">${esc(c.related.label)}</a></div>` : ''}
      </div>
    </section>

    <section class="sect alt" id="camp-how">
      <h2 class="sec">How to contribute</h2>
      <div class="cards">${ways.map(w => `<article class="card"><h3>${esc(w.title)}</h3><p>${esc(w.text)}</p>${wayBtn(w)}</article>`).join('')}</div>
    </section>

    <section class="sect" id="camp-needs">
      <h2 class="sec">What is needed</h2>
      <div class="narrow wide">${needs}</div>
    </section>

    <section class="sect alt" id="camp-updates">
      <h2 class="sec">Campaign updates</h2>
      <div class="narrow wide">${updates}</div>
    </section>

    <section class="sect" id="camp-ideas">
      <h2 class="sec">Suggestions and ideas</h2>
      <div class="narrow">
        <p class="notice">The Present Tense is continuously growing and developing. We welcome your suggestions because we want our initiatives to evolve alongside the needs of the communities we support.</p>
        <p>How could the ${esc(c.name)} campaign be better? Share a recommendation, an idea, or something we may have missed.</p>
      </div>

      <form class="form" data-form="campaign-suggestion" data-success="Thank you! Your suggestion has been sent to our team." novalidate>
        <input type="hidden" name="campaign" value="${esc(c.name)}">

        <label for="cs-name" class="sr">Your name</label>
        <input class="field" id="cs-name" name="name" placeholder="Your name (optional)" autocomplete="name" maxlength="100">

        <label for="cs-email" class="sr">Email address</label>
        <input class="field" id="cs-email" name="email" type="email" placeholder="Email (optional, if you'd like a reply)" autocomplete="email">

        <label for="cs-msg" class="sr">Your suggestion</label>
        <textarea class="field" id="cs-msg" name="message" rows="5" placeholder="Your suggestion or idea" required data-label="your suggestion" maxlength="4000"></textarea>

        <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">

        <button type="submit" class="btn btn-ink">Send suggestion</button>
        <p class="status" role="status" aria-live="polite"></p>
      </form>
    </section>
  `;

  buildWish(page);
  return true;
}


function renderSponsor(page, id) {
  const s = SPONSORS.find(x => x.id === id);
  if (!s) return false;

  const site = isUrl(s.website)
    ? `<a class="btn btn-ink" href="${esc(s.website)}" target="_blank" rel="noopener noreferrer">Visit ${esc(s.name)}'s website ↗</a><p class="small">${esc(host(s.website))}</p>`
    : '<p class="small">Official website link to be added.</p>';

  page.innerHTML = `
    <section class="pg-hero sponsor-hero">
      <a class="back" href="#home" data-back>← Back</a>
      <div class="p-logo big" role="img" aria-label="${esc(s.name)} logo">
        ${s.image ? `<img src="${esc(s.image)}" alt="">` : esc(s.logo)}
      </div>
      ${placeholderChip(s)}
      <h1 class="pg-title">${esc(s.name)}</h1>
      <p class="script">a valued partner of The Present Tense</p>
    </section>

    <section class="sect">
      <div class="narrow wide">
        <div class="mini">
          <h2 class="mini-h">About ${esc(s.name)}</h2>
          <p>${esc(s.about)}</p>
        </div>

        <div class="mini alt-mini">
          <h2 class="mini-h">Their involvement with The Present Tense</h2>
          <p>${esc(s.involvement)}</p>
        </div>

        <div class="mini">
          <h2 class="mini-h">How they support our initiatives</h2>
          <p>${esc(s.contribution)}</p>
        </div>

        <div class="btn-row center">${site}</div>
      </div>
    </section>

    <section class="sect alt">
      <div class="empty">
        <h3>Would your organisation like to join them?</h3>
        <p>We work with businesses and organisations of every size.</p>
        <a href="#contact" class="btn btn-ink btn-sm" data-type="Sponsor or partner">Become a sponsor</a>
      </div>
    </section>
  `;

  return true;
}


/* ===== Tabs (hash routing) + friendly 404 ===== */

const pages = $$('.page');

const DYNAMIC = {
  campaign: renderCampaign,
  sponsor: renderSponsor
};

const ALIAS = {
  kids: 'angel-tree'
};

const NAV_PARENT = {
  campaign: 'giving',
  charities: 'giving',
  supporters: 'giving'
};


function updateShare() {
  const link = 'https://wa.me/?text=' +
    encodeURIComponent('The Present Tense: ' + location.href);

  $$('.share').forEach(a => {
    a.href = link;
  });
}


function showPage() {
  let raw = 'home';

  try {
    raw = decodeURIComponent(location.hash.slice(1)) || 'home';
  } catch {
    raw = 'not-found';
  }

  const [root, slug] = raw.split('/');
  const id = ALIAS[root] || root;

  let current = pages.find(p =>
    p.id === id && !(id in DYNAMIC && !slug)
  ) || $('#not-found');

  if (current.id in DYNAMIC && !DYNAMIC[current.id](current, slug)) {
    current = $('#not-found');
  }

  pages.forEach(p => {
    p.hidden = p !== current;
  });

  const navId = NAV_PARENT[current.id] || current.id;

  $$('#nav a').forEach(a => {
    if (a.getAttribute('href') === '#' + navId) {
      a.setAttribute('aria-current', 'page');
    } else {
      a.removeAttribute('aria-current');
    }
  });

  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');

  const h1 = $('h1', current);

  document.title =
    (current.id !== 'home' && h1 ? h1.textContent + ' | ' : '') +
    'The Present Tense';

  wireGoFundMe(current);
  updateShare();

  const target = ALIAS[root]
    ? document.getElementById(root)
    : null;

  if (target) {
    target.scrollIntoView();
  } else {
    window.scrollTo(0, 0);
  }
}


window.addEventListener('hashchange', showPage);
showPage();


/* ===== Click helpers ===== */

document.addEventListener('click', e => {
  const t = e.target.closest('[data-type]');

  if (t) {
    const sel = $('#c-type');
    if (sel) sel.value = t.dataset.type;
  }

  const sc = e.target.closest('[data-scroll]');

  if (sc) {
    const el = document.getElementById(sc.dataset.scroll);

    if (el) {
      el.scrollIntoView({
        behavior: calm ? 'auto' : 'smooth',
        block: 'center'
      });

      if (el.matches('input,textarea,select')) {
        el.focus({ preventScroll: true });
      }
    }
  }

  if (e.target.closest('[data-back]')) {
    e.preventDefault();

    if (history.length > 1) {
      history.back();
    } else {
      location.hash = '#home';
    }
  }
});


/* ===== Countdown banner ===== */

(() => {
  const days = Math.ceil(
    (new Date(NEXT_CAMPAIGN.date + 'T00:00:00') - new Date()) / 864e5
  );

  if (days > 0) {
    $('#countdown').textContent =
      `${NEXT_CAMPAIGN.name} campaign (planned): ${days} ${days === 1 ? 'day' : 'days'} to go.`;
  } else {
    $('#banner').hidden = true;
  }
})();


/* ===== Popups: close button + click outside ===== */

$$('dialog').forEach(d => {
  d.addEventListener('click', e => {
    if (e.target === d || e.target.closest('[data-close]')) {
      d.close();
    }
  });
});


/* ===== Gift tag preview ===== */

[
  ['tag-to', 'out-to', 'Someone special'],
  ['tag-from', 'out-from', 'A friend'],
  ['tag-msg', 'out-msg', 'Wishing you a bright season.']
].forEach(([inId, outId, fallback]) => {
  const input = document.getElementById(inId);
  const out = document.getElementById(outId);

  input.addEventListener('input', () => {
    out.textContent = input.value.trim() || fallback;
  });
});


/* ===== WhatsApp chat + back to top ===== */

$('#wa-chat').href =
  'https://wa.me/' + WHATSAPP_NUMBER + '?text=' +
  encodeURIComponent("Hi! I'd like to know more about The Present Tense.");

const topBtn = $('#to-top');

window.addEventListener('scroll', () => {
  topBtn.classList.toggle('show', window.scrollY > 600);
}, { passive: true });

topBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});


/* ===== Generic forms ===== */

document.addEventListener('submit', async (e) => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;

  e.preventDefault();

  const msg = $('.status', form);
  const btn = $('button[type="submit"]', form);

  $$('.invalid', form).forEach(i => i.classList.remove('invalid'));

  if (form.elements['_gotcha'] && form.elements['_gotcha'].value) {
    say(msg, form.dataset.success, 'ok');
    return;
  }

  for (const el of $$('[required]', form)) {
    const missing = el.type === 'checkbox'
      ? !el.checked
      : el.type === 'radio'
        ? !form.querySelector(`input[name="${el.name}"]:checked`)
        : !el.value.trim();

    if (missing) {
      el.classList.add('invalid');
      say(msg, `Please complete: ${el.dataset.label || el.name}.`, 'err');
      el.focus();
      return;
    }
  }

  const data = {};

  new FormData(form).forEach((v, k) => {
    if (k !== '_gotcha' && k !== 'consent') {
      data[k] = String(v).trim();
    }
  });

  if (data.email && !EMAIL_RE.test(data.email.toLowerCase())) {
    form.elements['email'].classList.add('invalid');
    say(msg, 'Please enter a valid email address, like name@example.com.', 'err');
    form.elements['email'].focus();
    return;
  }

  btn.disabled = true;
  say(msg, 'Sending…');

  try {
    await send(form.dataset.form, data);

    form.reset();

    say(
      msg,
      form.dataset.success || 'Thank you! Your message has been sent.',
      'ok'
    );

  } catch (err) {
    say(msg, err.message, 'err');

  } finally {
    btn.disabled = false;
  }
});


/* ===== Angel Tree sign-up =====
   Sends the signup to the organisation inbox only. */

(() => {
  const form = $('#signup');
  const first = $('#first-name');
  const last = $('#last-name');
  const email = $('#email');
  const msg = $('#signup-msg');

  const flag = (input, text) => {
    input.classList.add('invalid');
    say(msg, text, 'err');
    input.focus();
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    [first, last, email].forEach(i => i.classList.remove('invalid'));

    const f = first.value.trim();
    const l = last.value.trim();
    const em = email.value.trim().toLowerCase();

    if (form.elements['_gotcha'].value) {
      say(msg, "You're on the list!", 'ok');
      return;
    }

    if (f.length < 2 || !NAME_RE.test(f)) {
      return flag(first, 'Please enter your first name.');
    }

    if (l.length < 2 || !NAME_RE.test(l)) {
      return flag(last, 'Please enter your last name.');
    }

    if (!EMAIL_RE.test(em)) {
      return flag(email, 'Please enter a valid email address, like name@example.com.');
    }

    const btn = form.querySelector('button');
    btn.disabled = true;

    say(msg, 'Signing you up…');

    try {
      await send('angel-signup', {
        name: f + ' ' + l,
        email: em
      });

      form.reset();

      say(
        msg,
        `Thank you, ${f}! Your signup has been sent. We'll be in touch when children's submissions open.`,
        'ok'
      );

    } catch (err) {
      say(msg, err.message, 'err');

    } finally {
      btn.disabled = false;
    }
  });
})();


/* ===== Angel Tree: child cards + support this child popup ===== */

(() => {
  const list = arr =>
    `<ul class="tags">${arr.map(i =>
      `<li>${esc(i.n)} <small>${range(i)}</small></li>`
    ).join('')}</ul>`;

  $('#kid-cards').innerHTML = CHILDREN.map(k => `
    <article class="kid${k.example ? ' example' : ''}">
      ${k.example ? '<span class="chip">Example card only</span>' : ''}
      <div class="kid-head">
        <span class="avatar">${esc(k.name[0])}</span>
        <div>
          <h3>${esc(k.name)}</h3>
          <span class="small">Age ${esc(k.age)}</span>
        </div>
      </div>
      <h4>Needs</h4>
      ${list(k.needs)}
      <h4>Wants</h4>
      ${list(k.wants)}
      <button type="button" class="btn btn-ink btn-sm" data-adopt="${esc(k.id)}">Support ${esc(k.name)}</button>
    </article>
  `).join('');

  const dlg = $('#adopt');
  const form = $('#adopt-form');
  const msg = $('#adopt-msg');
  const done = $('#adopt-done');

  let cur;
  let items;

  const picked = () =>
    $$('input[name="item"]:checked', form).map(c => items[c.value]);

  const sync = () => {
    const p = picked();
    const pay = form.elements['how'].value === 'pay';

    const lo = p.reduce((s, i) => s + i.lo, 0);
    const hi = p.reduce((s, i) => s + i.hi, 0);

    $('#adopt-total').textContent = p.length
      ? `${pay ? 'Estimated to pay' : 'Estimated gift value'}: N$${lo}–${hi}`
      : 'Tick the items you would like to cover.';

    $('#adopt-drop').hidden = pay;
    $('#adopt-pay').hidden = !pay;
  };

  $('#kid-cards').addEventListener('click', e => {
    const b = e.target.closest('[data-adopt]');
    if (!b) return;

    cur = CHILDREN.find(k => k.id === b.dataset.adopt);

    items = [
      ...cur.needs.map(i => ({ ...i, t: 'Need' })),
      ...cur.wants.map(i => ({ ...i, t: 'Want' }))
    ];

    $('#adopt-title').textContent = 'Support ' + cur.name;
    $('#adopt-demo').hidden = !cur.example;

    $('#adopt-items').innerHTML = items.map((i, x) =>
      `<label class="pick"><input type="checkbox" name="item" value="${x}"><span>${esc(i.n)} <small>(${i.t}) ${range(i)}</small></span></label>`
    ).join('');

    $('#adopt-drop').textContent =
      'Drop your gift off at: ' + cur.drop;

    form.reset();
    form.hidden = false;
    done.hidden = true;

    say(msg, '');
    sync();

    dlg.showModal();
  });

  form.addEventListener('change', sync);

  form.addEventListener('submit', async e => {
    e.preventDefault();

    if (form.elements['_gotcha'].value) return;

    const p = picked();
    const how = form.elements['how'].value;

    const name = form.elements['pname'].value.trim();
    const em = form.elements['pemail'].value.trim().toLowerCase();

    if (!p.length) {
      return say(msg, 'Please tick at least one item.', 'err');
    }

    if (name.length < 2) {
      return say(msg, 'Please enter your name.', 'err');
    }

    if (!EMAIL_RE.test(em)) {
      return say(msg, 'Please enter a valid email address.', 'err');
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;

    say(msg, 'Sending…');

    try {
      if (!cur.example) {
        await send('angel-pledge', {
          child: cur.name + ' (' + cur.id + ')',
          method: how === 'pay' ? 'Pay for items' : 'Drop off gift',
          items: p.map(i => i.n).join(', '),
          name,
          email: em
        });
      }

      form.hidden = true;
      done.hidden = false;

      $('#adopt-done-text').textContent =
        (cur.example ? 'This is only an example, so nothing was sent. ' : '') +
        (how === 'pay'
          ? PAY_INFO
          : 'Thank you! Please drop your gift at: ' + cur.drop + '.');

    } catch (err) {
      say(msg, err.message, 'err');

    } finally {
      btn.disabled = false;
    }
  });
})();


/* ===== Footer email updates =====
   Formspree signup + EmailJS welcome email. */

(() => {
  const form = $('#news-form');
  const input = $('#news-email');
  const nameIn = $('#news-name');
  const msg = $('#news-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const em = input.value.trim().toLowerCase();
    const nm = nameIn.value.trim();

    if (!EMAIL_RE.test(em)) {
      say(msg, 'Please enter a valid email address.', 'err');
      input.focus();
      return;
    }

    if (nm && !NAME_RE.test(nm)) {
      say(msg, 'Please enter a valid name, or leave it blank.', 'err');
      nameIn.focus();
      return;
    }

    const btn = form.querySelector('button');
    btn.disabled = true;

    say(msg, 'Signing you up…');

    try {
      // Record the subscription first.
      // If EmailJS is unavailable, the signup still succeeds.

      await send('newsletter', {
        name: nm,
        email: em
      });

      form.reset();

      try {
        const emailjs = await loadEmailJS();

        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            name: nm,
            email: em
          }
        );

        say(
          msg,
          "Thank you! You're on the list! We've sent you a welcome email. If you can't find it in your inbox, please check your spam or junk folder. 💌",
          'ok'
        );

      } catch (emailError) {
        console.error(
          'Newsletter confirmation email failed:',
          emailError
        );

        say(
          msg,
          "Thank you! You're on the list. Your signup was received, but the confirmation email couldn't be sent just now.",
          'ok'
        );
      }

    } catch (err) {
      say(msg, err.message, 'err');

    } finally {
      btn.disabled = false;
    }
  });
})();


/* ===== Contact form =====
   Formspree sends the enquiry to the organisation.
   EmailJS sends a confirmation email to the person submitting it. */

(() => {
  const form = $('#contact-form');
  const done = $('#contact-done');
  const msg = $('#contact-msg');
  const type = $('#c-type');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (form.elements['_gotcha'].value) {
      form.hidden = true;
      done.hidden = false;
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const contactData = {
      type: type.value,
      name: form.elements['name'].value.trim(),
      email: form.elements['email'].value.trim().toLowerCase(),
      message: form.elements['message'].value.trim()
    };

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;

    say(msg, 'Sending…');

    try {
      // First send the actual enquiry to The Present Tense.

      await send('contact', contactData);

      // Then send the automatic thank-you email.
      // A failure here does not undo the successful enquiry.

      try {
        const emailjs = await loadEmailJS();

        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_CONTACT_TEMPLATE_ID,
          contactData
        );

        console.log('Contact confirmation email sent successfully.');

      } catch (emailError) {
        console.error(
          'Contact confirmation email failed:',
          emailError
        );
      }

      form.reset();
      say(msg, '');

      form.hidden = true;
      done.hidden = false;

    } catch (err) {
      say(msg, err.message, 'err');

    } finally {
      btn.disabled = false;
    }
  });

  $('#contact-again').addEventListener('click', () => {
    done.hidden = true;
    form.hidden = false;
    type.focus();
  });
})();
