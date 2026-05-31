/* ── MOBILE NAV ─────────────────────────────────────────────────── */
const burger = document.getElementById('burger');
const mobileNav = document.getElementById('mobile-nav');
burger.addEventListener('click', () => mobileNav.classList.toggle('open'));
mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('open')));

/* ── SCROLL FADE-IN ─────────────────────────────────────────────── */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } });
}, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.fade-in').forEach(el => io.observe(el));

/* ── CAROUSEL ───────────────────────────────────────────────────── */
function initCarousel(trackId, dotsId) {
  const track = document.getElementById(trackId);
  const dotsEl = document.getElementById(dotsId);
  if (!track || !dotsEl) return;

  const cards = Array.from(track.children);
  let cur = 0;

  // Build dots
  cards.forEach((_, i) => {
    const b = document.createElement('button');
    b.className = 'dot-btn' + (i === 0 ? ' on' : '');
    b.setAttribute('aria-label', `Slide ${i + 1}`);
    b.addEventListener('click', () => go(i));
    dotsEl.appendChild(b);
  });

  function gap() {
    return parseFloat(getComputedStyle(track).gap) || 14;
  }
  function cardW() {
    return cards[0] ? cards[0].offsetWidth + gap() : 0;
  }
  function go(idx) {
    cur = Math.max(0, Math.min(idx, cards.length - 1));
    track.style.transform = `translateX(-${cur * cardW()}px)`;
    dotsEl.querySelectorAll('.dot-btn').forEach((b, i) => b.classList.toggle('on', i === cur));
  }

  // Arrow buttons (siblings)
  const wrap = track.closest('.carousel-row');
  wrap.querySelectorAll('.arr').forEach(btn => {
    btn.addEventListener('click', () => go(cur + parseInt(btn.dataset.dir)));
  });

  // Drag
  let startX = 0, dragging = false, dx = 0;
  const vp = track.parentElement;
  vp.addEventListener('mousedown', e => { dragging = true; startX = e.clientX; track.style.transition = 'none'; });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    dx = e.clientX - startX;
    track.style.transform = `translateX(-${cur * cardW() - dx}px)`;
  });
  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    track.style.transition = '';
    go(dx < -60 ? cur + 1 : dx > 60 ? cur - 1 : cur);
    dx = 0;
  });
  vp.addEventListener('touchstart', e => { startX = e.touches[0].clientX; track.style.transition = 'none'; }, { passive: true });
  vp.addEventListener('touchend', e => {
    track.style.transition = '';
    const d = e.changedTouches[0].clientX - startX;
    go(d < -50 ? cur + 1 : d > 50 ? cur - 1 : cur);
  });

  window.addEventListener('resize', () => go(cur), { passive: true });
}

initCarousel('t-short', 'd-short');
initCarousel('t-long', 'd-long');

/* ── VIMEO CLICK-TO-PLAY + PAUSE OTHERS ────────────────────────── */
const players = new Map();

function loadVimeoAPI() {
  return new Promise(resolve => {
    if (window.Vimeo) return resolve();
    const s = document.createElement('script');
    s.src = 'https://player.vimeo.com/api/player.js';
    s.onload = resolve;
    document.head.appendChild(s);
  });
}

function pauseAll(exceptId) {
  players.forEach((p, id) => { if (id !== exceptId) p.pause(); });
}

async function activate(thumb) {
  const id = thumb.dataset.id;
  if (players.has(id)) { pauseAll(id); players.get(id).play(); return; }
  await loadVimeoAPI();
  const iframe = document.createElement('iframe');
  iframe.src = `https://player.vimeo.com/video/${id}?badge=0&autopause=0&autoplay=1&quality=auto&app_id=58479`;
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;';
  thumb.innerHTML = '';
  thumb.appendChild(iframe);
  const player = new Vimeo.Player(iframe);
  players.set(id, player);
  player.on('play', () => pauseAll(id));
}

document.querySelectorAll('.thumb').forEach(t => t.addEventListener('click', () => activate(t)));
