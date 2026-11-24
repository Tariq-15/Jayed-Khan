// Jayeds Writing: hash-routed reader. #/ home, #/book/<id>, #/read/<id>/<part number>.
// Content lives in content/ and is edited through /admin (Sveltia CMS); build.js merges it into content/library.json.
const AUTHOR = 'মো: জায়েদ খান';
const app = document.getElementById('app');

const bn = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const ongoing = b => b.status === 'চলমান';

// The CMS saves markdown: **bold**, *italic*, and \-escaped characters.
const inline = s => esc(s)
  .replace(/(?<!\\)\*\*(.+?)(?<!\\)\*\*/g, '<b>$1</b>')
  .replace(/(?<!\\)[*_](.+?)(?<!\\)[*_]/g, '<i>$1</i>')
  .replace(/\\(.)/g, '$1');

// One paragraph per line. "## x" = scene heading, "————" or "---" = scene break, ![description](path "caption") = picture.
function renderText(text) {
  return String(text ?? '').split('\n').map(l => l.trim().replace(/\\$/, '')).filter(Boolean).map(l => {
    const img = l.match(/^!\[(.*?)\]\((\S+?)(?:\s+"(.*)")?\)$/);
    if (img) {
      const caption = img[3] || img[1];
      return `<figure><img src="${esc(img[2])}" alt="${esc(img[1])}" loading="lazy">${caption ? `<figcaption>${inline(caption)}</figcaption>` : ''}</figure>`;
    }
    if (/^#{1,6} /.test(l)) return `<h2 class="scene">${inline(l.replace(/^#+ /, ''))}</h2>`;
    if (/^(\\?[-—_*]\s*){3,}$/.test(l)) return '<hr>';
    return `<p>${inline(l)}</p>`;
  }).join('\n');
}

let BOOKS;
try {
  ({ books: BOOKS } = await fetch('content/library.json').then(r => r.json()));
} catch {
  app.innerHTML = '<p class="wrap load-error">বইয়ের তালিকা লোড করা যায়নি। ইন্টারনেট সংযোগ দেখে পেজটি আবার লোড করুন।</p>';
  throw new Error('content/library.json could not be loaded');
}

function cover(b) {
  if (b.cover) return `<img class="cover" src="${esc(b.cover)}" alt="${esc(b.title)} বইয়ের প্রচ্ছদ">`;
  return `<div class="cover cover--type" role="img" aria-label="${esc(b.title)} বইয়ের প্রচ্ছদ"${b.accent ? ` style="--accent:${esc(b.accent)}"` : ''}>
    <span class="cover__title">${esc(b.title)}</span><span class="cover__author">${AUTHOR}</span></div>`;
}

function hero(b, onHome) {
  const style = [b.bg && `background-image:url('${b.bg}')`, b.accent && `--accent:${b.accent}`].filter(Boolean).join(';');
  return `
  <section class="hero${b.bg ? '' : ' hero--plain'}" style="${esc(style)}">
    <div class="hero__inner wrap">
      <div class="hero__cover">${cover(b)}</div>
      <div class="hero__text">
        <h1 class="hero__title">${esc(b.title)}</h1>
        <p class="hero__author">${AUTHOR}</p>
        <ul class="tags">
          <li>${esc(b.genre)}</li>
          <li>${bn(b.parts.length)}টি পর্ব প্রকাশিত</li>
          ${ongoing(b) ? '<li>চলমান</li>' : ''}
        </ul>
        <p class="hero__blurb">${esc(b.blurb)}</p>
        <div class="hero__actions">
          ${b.parts.length ? `<a class="mc-button mc-button--l" href="#/read/${b.id}/1">প্রথম পর্ব পড়ুন</a>` : ''}
          ${onHome ? `<a class="mc-button mc-button--l mc-button--bordered" href="#/book/${b.id}">সব পর্ব দেখুন</a>` : ''}
        </div>
      </div>
    </div>
  </section>`;
}

function home() {
  const featured = BOOKS.find(b => b.featured) || BOOKS[0];
  document.title = 'Jayeds Writing — মো: জায়েদ খানের লেখা';
  app.innerHTML = (featured ? hero(featured, true) : '') + `
  <section class="shelf wrap" aria-labelledby="shelf-h">
    <h2 id="shelf-h" class="section-title">সব বই</h2>
    <ul class="shelf__grid">${BOOKS.map(b => `
      <li><a class="book-card" href="#/book/${b.id}">${cover(b)}
        <h3>${esc(b.title)}</h3>
        <p>${esc(b.genre)}</p>
        <p>${bn(b.parts.length)}টি পর্ব</p></a></li>`).join('')}
    </ul>
  </section>`;
}

function bookPage(b) {
  document.title = `${b.title} — Jayeds Writing`;
  app.innerHTML = hero(b) + `
  <section class="parts wrap" aria-labelledby="parts-h">
    <h2 id="parts-h" class="section-title">পর্বসমূহ</h2>
    <ol class="parts__list">${b.parts.map((p, i) => `
      <li><a href="#/read/${b.id}/${i + 1}">
        <span class="parts__num">${bn(i + 1)}</span>
        <span class="parts__title">${esc(p.title)}</span>
        <span class="parts__time">${bn(p.minutes)} মিনিট</span></a></li>`).join('')}
    </ol>
    ${ongoing(b) ? '<p class="parts__more">পরের পর্ব শিগগিরই আসছে।</p>' : ''}
    ${b.note ? `<aside class="note"><h2 class="note__title">বিশেষ দ্রষ্টব্য</h2>${renderText(b.note)}</aside>` : ''}
  </section>`;
}

// Reader font size, a Mozaic quantity selector: 16–24px in 2px steps, boundary buttons natively disabled.
const FS = { min: 16, max: 24, step: 2 };
let fs = 18;
try { fs = Number(localStorage.getItem('fs')) || 18; } catch {}

function setFs(v) {
  fs = Math.min(FS.max, Math.max(FS.min, v));
  try { localStorage.setItem('fs', fs); } catch {}
  const reader = document.querySelector('.reader');
  if (!reader) return;
  reader.style.setProperty('--fs', `${fs / 16}rem`);
  document.querySelector('.mc-quantity-selector__input').textContent = bn(fs);
  document.querySelectorAll('[data-fs]').forEach(btn => {
    btn.disabled = btn.dataset.fs < 0 ? fs <= FS.min : fs >= FS.max;
    btn.classList.toggle('is-disabled', btn.disabled);
  });
}

async function reader(b, n) {
  const p = b.parts[n - 1], prev = b.parts[n - 2], next = b.parts[n];
  const hash = location.hash;
  let body;
  try {
    ({ body } = await fetch(p.file).then(r => r.json()));
  } catch {
    body = 'এই পর্বটি লোড করা যায়নি। ইন্টারনেট সংযোগ দেখে পেজটি আবার লোড করুন।';
  }
  if (location.hash !== hash) return; // reader moved on while this part was loading
  const accent = b.accent ? ` style="--accent:${esc(b.accent)}"` : '';
  document.title = `${p.title} — ${b.title}`;
  app.innerHTML = `
  <div class="reader-bar"${accent}>
    <div class="reader-bar__inner wrap">
      <a class="reader-bar__back" href="#/book/${b.id}">
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4 6.5 10l6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>
        ${esc(b.title)}</a>
      <div class="mc-quantity-selector" role="group" aria-label="লেখার আকার">
        <button type="button" class="mc-button mc-button--square mc-button--bordered mc-quantity-selector__button-left" data-fs="-1" aria-label="লেখা ছোট করুন">অ−</button>
        <output class="mc-quantity-selector__input" aria-live="polite"></output>
        <button type="button" class="mc-button mc-button--square mc-button--bordered mc-quantity-selector__button-right" data-fs="1" aria-label="লেখা বড় করুন">অ+</button>
      </div>
    </div>
    <div class="reader-bar__progress"></div>
  </div>
  <article class="reader"${accent}>
    <header class="reader__head">
      <h1>${esc(p.title)}</h1>
      <p class="reader__meta"><span>${AUTHOR}</span><span>${bn(p.minutes)} মিনিটের পড়া</span></p>
    </header>
    ${renderText(body)}
    ${!next && ongoing(b) ? '<p class="reader__tbc">চলবে…</p>' : ''}
    <nav class="pager" aria-label="পর্ব">
      ${prev ? `<a class="pager__link" href="#/read/${b.id}/${n - 1}"><span>আগের পর্ব</span>${esc(prev.title)}</a>` : ''}
      ${next
        ? `<a class="pager__link pager__link--next" href="#/read/${b.id}/${n + 1}"><span>পরের পর্ব</span>${esc(next.title)}</a>`
        : `<a class="pager__link pager__link--next" href="#/book/${b.id}"><span>সব পর্ব</span>${esc(b.title)}</a>`}
    </nav>
  </article>`;
  setFs(fs);
  scrollTo(0, 0);
}

app.addEventListener('click', e => {
  const btn = e.target.closest('[data-fs]');
  if (btn) setFs(fs + btn.dataset.fs * FS.step);
});

addEventListener('scroll', () => {
  const bar = document.querySelector('.reader-bar__progress');
  if (!bar) return;
  const h = document.documentElement;
  bar.style.transform = `scaleX(${h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)})`;
}, { passive: true });

function route() {
  const [page, id, n] = location.hash.replace(/^#\/?/, '').split('/');
  const b = BOOKS.find(x => x.id === id);
  if (page === 'read' && b?.parts[n - 1]) return reader(b, Number(n));
  if (page === 'book' && b) bookPage(b);
  else home();
  scrollTo(0, 0);
}

addEventListener('hashchange', route);
route();
document.getElementById('year').textContent = bn(new Date().getFullYear());

// Self-check for the text format, including what the CMS editor writes.
console.assert(renderText('## ক\n\n————\n![খ](x.jpg)\nগ <b>') ===
  '<h2 class="scene">ক</h2>\n<hr>\n<figure><img src="x.jpg" alt="খ" loading="lazy"><figcaption>খ</figcaption></figure>\n<p>গ &lt;b&gt;</p>', 'renderText format');
console.assert(renderText('**ঘ** *ঙ* 2\\*3\\\n\\*\\*\\*\n![a](images/p.webp "চ")') ===
  '<p><b>ঘ</b> <i>ঙ</i> 2*3</p>\n<hr>\n<figure><img src="images/p.webp" alt="a" loading="lazy"><figcaption>চ</figcaption></figure>', 'renderText markdown');
