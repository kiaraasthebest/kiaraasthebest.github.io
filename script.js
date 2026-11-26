/* ===== Settings: fill these in ===== */
const FORM_ENDPOINT = "PASTE_YOUR_FORMSPREE_URL_HERE";       // Angel Tree sign-ups
const CONTACT_ENDPOINT = "PASTE_YOUR_FORMSPREE_URL_HERE";    // Contact form
const NEWSLETTER_ENDPOINT = "PASTE_YOUR_FORMSPREE_URL_HERE"; // Footer email updates
const ANGEL_ENDPOINT = "PASTE_YOUR_FORMSPREE_URL_HERE";      // Angel Tree child-card pledges
const GOFUNDME_URL = "PASTE_YOUR_GOFUNDME_URL_HERE";         // Your GoFundMe page
const WHATSAPP_NUMBER = "264000000000";                      // Country code + number, digits only
const NEXT_CAMPAIGN = { name: "Valentine's Day", date: "2027-02-14" };
const PAY_INFO = "We'll email you how to pay shortly. Thank you!";

/* ===== Partners: edit this list (logo = short text, or put an image path in "image") ===== */
const SPONSORS = [
  { name: "Partner One", logo: "P1", image: "", website: "",
    intro: "One of the organisations helping us bring celebrations to more people.",
    role: "Supports us through its agreed contribution.",
    why: "Their support helps us reach more people." },
  { name: "Partner Two", logo: "P2", image: "", website: "",
    intro: "A valued partner in our mission.",
    role: "Contributes to our seasonal campaigns.",
    why: "Partnerships let us give all year round." },
  { name: "Partner Three", logo: "P3", image: "", website: "",
    intro: "An organisation supporting the joy of giving.",
    role: "Helps through its sponsorship.",
    why: "Small acts of generosity become big moments." },
  { name: "Partner Four", logo: "P4", image: "", website: "",
    intro: "A member of our growing community.",
    role: "Supports our gifting projects.",
    why: "Makes our projects more impactful." }
];

/* ===== Angel Tree children: add real cards here =====
   Share a first name and age only: no photos or surnames, and only with guardian consent.
   Prices are rough ranges in Namibian dollars. Remove "example: true" for real cards. */
const CHILDREN = [
  { id: "example", example: true, name: "Tomas", age: 7,
    drop: "Drop-off location to be announced",
    needs: [{ n: "Bedding set", lo: 250, hi: 400 }, { n: "Socks (3 pairs)", lo: 60, hi: 100 }, { n: "School shoes", lo: 300, hi: 500 }],
    wants: [{ n: "Toy car", lo: 80, hi: 150 }, { n: "Picture book", lo: 70, hi: 120 }] }
];

/* ===== Helpers ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const isUrl = (u) => /^https?:/.test(u);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^\p{L}[\p{L}\s'’.-]*$/u;
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const range = (i) => `N$${i.lo}–${i.hi}`;

async function send(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Request failed');
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

/* ===== Tabs (hash routing) + friendly 404 ===== */
const pages = $$('.page');

function updateShare() {
  const link = 'https://wa.me/?text=' + encodeURIComponent('The Present Tense: ' + location.href);
  $$('.share').forEach(a => { a.href = link; });
}

function showPage() {
  const id = location.hash.slice(1) || 'home';
  const current = pages.find(p => p.id === id) || $('#not-found');
  pages.forEach(p => { p.hidden = p !== current; });
  $$('#nav a').forEach(a => {
    if (a.getAttribute('href') === '#' + current.id) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  const h1 = $('h1', current);
  document.title = (current.id !== 'home' && h1 ? h1.textContent + ' | ' : '') + 'The Present Tense';
  updateShare();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', showPage);
showPage();

/* ===== Countdown banner ===== */
(() => {
  const days = Math.ceil((new Date(NEXT_CAMPAIGN.date + 'T00:00:00') - new Date()) / 864e5);
  if (days > 0) {
    $('#countdown').textContent =
      `${NEXT_CAMPAIGN.name} campaign (planned): ${days} ${days === 1 ? 'day' : 'days'} to go.`;
  } else {
    $('#banner').hidden = true;
  }
})();

/* ===== Wishlist progress bars ===== */
$$('.wish li').forEach(li => {
  const have = Number(li.dataset.have) || 0;
  const goal = Number(li.dataset.goal) || 0;
  const name = li.textContent.trim();
  const pct = goal ? Math.min(100, Math.round(have / goal * 100)) : 0;
  li.innerHTML =
    `<span class="row"><span>${name}</span><span>${have} of ${goal}</span></span>` +
    `<span class="track" role="progressbar" aria-label="${name}" aria-valuemin="0" aria-valuemax="${goal}" aria-valuenow="${have}">` +
    `<span class="fill" style="width:${pct}%"></span></span>`;
});

/* ===== Popups: close button + click outside ===== */
$$('dialog').forEach(d => {
  d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
});

/* ===== Partners: scrolling logos + detail popup ===== */
(() => {
  const dlg = $('#partner-dlg');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const logo = (s, i, dup) =>
    `<button type="button" class="p-logo" data-i="${i}" aria-label="About ${esc(s.name)}"${dup ? ' aria-hidden="true" tabindex="-1"' : ''}>` +
    `${s.image ? `<img src="${esc(s.image)}" alt="">` : esc(s.logo)}</button>`;
  const row = (order, rev) => {
    const set = dup => order.map(i => logo(SPONSORS[i], i, dup)).join('');
    return `<div class="circles${rev ? ' rev' : ''}"><div class="circles-track">${set(false)}${calm ? '' : set(true)}</div></div>`;
  };
  const order = SPONSORS.map((_, i) => i);
  const shifted = order.map(i => (i + 2) % order.length);

  $$('[data-partners]').forEach(box => {
    box.innerHTML = `<div class="partners-panel"><h2 class="sec">Our partners and sponsors</h2>` +
      `${row(order, false)}${row(shifted, true)}<p class="p-hint">Tap a logo to learn more</p></div>`;
    box.addEventListener('click', e => {
      const b = e.target.closest('.p-logo'); if (!b) return;
      const s = SPONSORS[b.dataset.i];
      $('#pd-logo').innerHTML = s.image ? `<img src="${esc(s.image)}" alt="${esc(s.name)} logo">` : esc(s.logo);
      $('#pd-name').textContent = s.name;
      $('#pd-intro').textContent = s.intro;
      $('#pd-role').textContent = s.role;
      $('#pd-why').textContent = s.why;
      const a = $('#pd-site');
      a.hidden = !s.website;
      if (s.website) a.href = s.website;
      dlg.showModal();
    });
  });
})();

/* ===== GoFundMe buttons ===== */
$$('[data-gofundme]').forEach(a => {
  if (isUrl(GOFUNDME_URL)) { a.href = GOFUNDME_URL; return; }
  a.href = '#contact';
  a.removeAttribute('target');
  a.addEventListener('click', () => { $('#c-type').value = 'Donations'; });
});

/* ===== Gift tag preview ===== */
[['tag-to', 'out-to', 'Someone special'],
 ['tag-from', 'out-from', 'A friend'],
 ['tag-msg', 'out-msg', 'Wishing you a bright season.']].forEach(([inId, outId, fallback]) => {
  const input = document.getElementById(inId);
  const out = document.getElementById(outId);
  input.addEventListener('input', () => { out.textContent = input.value.trim() || fallback; });
});

/* ===== WhatsApp chat + back to top ===== */
$('#wa-chat').href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' +
  encodeURIComponent("Hi! I'd like to know more about The Present Tense.");

const topBtn = $('#to-top');
window.addEventListener('scroll', () => topBtn.classList.toggle('show', window.scrollY > 600), { passive: true });
topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ===== Angel Tree sign-up ===== */
(() => {
  const form = $('#signup');
  const first = $('#first-name'), last = $('#last-name'), email = $('#email');
  const msg = $('#signup-msg');

  const flag = (input, text) => { input.classList.add('invalid'); say(msg, text, 'err'); input.focus(); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    [first, last, email].forEach(i => i.classList.remove('invalid'));
    const f = first.value.trim(), l = last.value.trim(), em = email.value.trim().toLowerCase();

    if (form.elements['_gotcha'].value) { say(msg, "You're on the list!", 'ok'); return; }
    if (f.length < 2 || !NAME_RE.test(f)) return flag(first, 'Please enter your first name.');
    if (l.length < 2 || !NAME_RE.test(l)) return flag(last, 'Please enter your last name.');
    if (!EMAIL_RE.test(em)) return flag(email, 'Please enter a valid email address, like name@example.com.');

    const saved = JSON.parse(localStorage.getItem('angelTreeSignups') || '[]');
    if (saved.includes(em)) { say(msg, "You're already on the list. We'll email you when submissions open.", 'ok'); return; }

    const btn = form.querySelector('button');
    btn.disabled = true;
    say(msg, 'Signing you up…');
    try {
      if (isUrl(FORM_ENDPOINT)) {
        await send(FORM_ENDPOINT, { first_name: f, last_name: l, name: f + ' ' + l, email: em, source: 'Angel Tree sign-up' });
      } else {
        console.warn('FORM_ENDPOINT is not set: this sign-up was only saved in this browser.');
      }
      saved.push(em);
      localStorage.setItem('angelTreeSignups', JSON.stringify(saved));
      form.reset();
      say(msg, `Thank you, ${f}! You're on the list. We'll email you when children's submissions open.`, 'ok');
    } catch (err) {
      say(msg, "Something went wrong and we couldn't sign you up. Please try again.", 'err');
    } finally {
      btn.disabled = false;
    }
  });
})();

/* ===== Angel Tree: child cards + "support this child" popup ===== */
(() => {
  const list = arr => `<ul class="tags">${arr.map(i => `<li>${esc(i.n)} <small>${range(i)}</small></li>`).join('')}</ul>`;
  $('#kid-cards').innerHTML = CHILDREN.map(k => `
    <article class="kid${k.example ? ' example' : ''}">
      ${k.example ? '<span class="chip">Example card only</span>' : ''}
      <div class="kid-head"><span class="avatar">${esc(k.name[0])}</span><div><h3>${esc(k.name)}</h3><span class="small">Age ${esc(k.age)}</span></div></div>
      <h4>Needs</h4>${list(k.needs)}
      <h4>Wants</h4>${list(k.wants)}
      <button type="button" class="btn btn-ink btn-sm" data-adopt="${esc(k.id)}">Support ${esc(k.name)}</button>
    </article>`).join('');

  const dlg = $('#adopt'), form = $('#adopt-form'), msg = $('#adopt-msg'), done = $('#adopt-done');
  let cur, items;

  const picked = () => $$('input[name="item"]:checked', form).map(c => items[c.value]);
  const sync = () => {
    const p = picked(), pay = form.elements['how'].value === 'pay';
    const lo = p.reduce((s, i) => s + i.lo, 0), hi = p.reduce((s, i) => s + i.hi, 0);
    $('#adopt-total').textContent = p.length
      ? `${pay ? 'Estimated to pay' : 'Estimated gift value'}: N$${lo}–${hi}`
      : 'Tick the items you would like to cover.';
    $('#adopt-drop').hidden = pay;
    $('#adopt-pay').hidden = !pay;
  };

  $('#kid-cards').addEventListener('click', e => {
    const b = e.target.closest('[data-adopt]'); if (!b) return;
    cur = CHILDREN.find(k => k.id === b.dataset.adopt);
    items = [...cur.needs.map(i => ({ ...i, t: 'Need' })), ...cur.wants.map(i => ({ ...i, t: 'Want' }))];
    $('#adopt-title').textContent = 'Support ' + cur.name;
    $('#adopt-demo').hidden = !cur.example;
    $('#adopt-items').innerHTML = items.map((i, x) =>
      `<label class="pick"><input type="checkbox" name="item" value="${x}"><span>${esc(i.n)} <small>(${i.t}) ${range(i)}</small></span></label>`).join('');
    $('#adopt-drop').textContent = 'Drop your gift off at: ' + cur.drop;
    form.reset(); form.hidden = false; done.hidden = true; say(msg, ''); sync();
    dlg.showModal();
  });
  form.addEventListener('change', sync);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.elements['_gotcha'].value) return;
    const p = picked(), how = form.elements['how'].value;
    const name = form.elements['pname'].value.trim(), em = form.elements['pemail'].value.trim().toLowerCase();
    if (!p.length) return say(msg, 'Please tick at least one item.', 'err');
    if (name.length < 2) return say(msg, 'Please enter your name.', 'err');
    if (!EMAIL_RE.test(em)) return say(msg, 'Please enter a valid email address.', 'err');

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    say(msg, 'Sending…');
    try {
      if (!cur.example) {
        if (!isUrl(ANGEL_ENDPOINT)) throw new Error('not connected');
        await send(ANGEL_ENDPOINT, {
          source: 'Angel Tree card', child: cur.name + ' (' + cur.id + ')',
          method: how === 'pay' ? 'Pay for items' : 'Drop off gift',
          items: p.map(i => i.n).join(', '), name, email: em,
          _subject: 'Angel Tree pledge: ' + cur.name
        });
      }
      form.hidden = true; done.hidden = false;
      $('#adopt-done-text').textContent = (cur.example ? 'This is only an example, so nothing was sent. ' : '') +
        (how === 'pay' ? PAY_INFO : 'Thank you! Please drop your gift at: ' + cur.drop + '.');
    } catch (err) {
      say(msg, "Something went wrong. Please try again.", 'err');
    } finally {
      btn.disabled = false;
    }
  });
})();

/* ===== Footer email updates ===== */
(() => {
  const form = $('#news-form');
  const input = $('#news-email');
  const msg = $('#news-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const em = input.value.trim().toLowerCase();
    if (!EMAIL_RE.test(em)) { say(msg, 'Please enter a valid email address.', 'err'); input.focus(); return; }
    if (!isUrl(NEWSLETTER_ENDPOINT)) { say(msg, "Email updates aren't connected yet. Please try again later.", 'err'); return; }

    const btn = form.querySelector('button');
    btn.disabled = true;
    say(msg, 'Signing you up…');
    try {
      await send(NEWSLETTER_ENDPOINT, { email: em, source: 'Footer email updates' });
      form.reset();
      say(msg, "Thank you! You're on the list for updates.", 'ok');
    } catch (err) {
      say(msg, "Something went wrong. Please try again.", 'err');
    } finally {
      btn.disabled = false;
    }
  });
})();

/* ===== Contact form ===== */
(() => {
  const form = $('#contact-form');
  const done = $('#contact-done');
  const msg = $('#contact-msg');
  const type = $('#c-type');

  // Buttons elsewhere can pre-select the type: <a href="#contact" data-type="Volunteering">
  $$('[data-type]').forEach(link => {
    link.addEventListener('click', () => { type.value = link.dataset.type; });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.elements['_gotcha'].value) { form.hidden = true; done.hidden = false; return; }
    if (!isUrl(CONTACT_ENDPOINT)) { say(msg, "The contact form isn't connected yet. Please try again later.", 'err'); return; }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    say(msg, 'Sending…');
    try {
      await send(CONTACT_ENDPOINT, {
        type: type.value,
        name: form.elements['name'].value.trim(),
        email: form.elements['email'].value.trim(),
        message: form.elements['message'].value.trim(),
        _subject: 'New message: ' + type.value
      });
      form.reset();
      say(msg, '');
      form.hidden = true;
      done.hidden = false;
    } catch (err) {
      say(msg, "Something went wrong and your message didn't send. Please try again.", 'err');
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
