(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cssFade = getComputedStyle(document.documentElement).getPropertyValue('--fade-ms').trim();
  const fadeMs = parseInt(cssFade) || 300;

  function isInternalNavigableLink(a) {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
    const url = new URL(a.href, window.location.href);
    const sameOrigin = url.origin === window.location.origin;
    const isHashOnly = url.pathname === window.location.pathname && url.hash && url.hash.startsWith('#');
    return sameOrigin && !isHashOnly;
  }

  function setupFadeIn() {
    if (prefersReduced) return;
    requestAnimationFrame(() => document.body.classList.add('is-visible'));
  }

  function setupLinkInterception() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (prefersReduced) return;
      if (!isInternalNavigableLink(a)) return;

      e.preventDefault();
      document.body.classList.remove('is-visible'); // allows for fade-out to work properly

      setTimeout(() => {
        window.location.href = a.href;
      }, fadeMs);
    });
  }

  window.addEventListener('pageshow', (e) => {
    if (e.persisted && !prefersReduced) {
      document.body.classList.add('js-fade');
      document.body.classList.add('is-visible');
    }
  });

  window.addEventListener('DOMContentLoaded', () => {
    setupFadeIn();
    setupLinkInterception();
  });
})();

// === Feature Carousel + Lightbox (no autoplay, arrows outside, LB thumbnails) ===
(function () {
  const carousel = document.querySelector('.feature-carousel');
  if (!carousel) return;

  const track = carousel.querySelector('.feature-track');
  const slides = Array.from(carousel.querySelectorAll('.feature-slide'));

  // Arrows are outside the carousel, attached to the .feature-wrap container
  const wrap = carousel.closest('.feature-wrap') || document;
  const prevBtn = wrap.querySelector('.feature-nav.prev');
  const nextBtn = wrap.querySelector('.feature-nav.next');

  let index = 0;

  function setActive(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, idx) => s.classList.toggle('is-active', idx === index));
  }
  function next() { setActive(index + 1); }
  function prev() { setActive(index - 1); }

  // Buttons (dots removed)
  prevBtn && prevBtn.addEventListener('click', prev);
  nextBtn && nextBtn.addEventListener('click', next);

  // Keyboard support (left/right) when carousel is focused
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
  });

  // Lightbox wiring
  // Use class selector (matches your HTML: <div class="ftt-lightbox" hidden>)
  const lb = document.querySelector('.ftt-lightbox');
  if (!lb) { setActive(0); return; }

  const lbImg = lb.querySelector('.ftt-lightbox__img');
  const lbPrev = lb.querySelector('.ftt-lightbox__prev');
  const lbNext = lb.querySelector('.ftt-lightbox__next');
  const lbCloseEls = lb.querySelectorAll('.ftt-lightbox__close, [data-lb-close]');
  const lbBackdrop = lb.querySelector('.ftt-lightbox__backdrop');
  const thumbsWrap = lb.querySelector('.ftt-lightbox__thumbs');

  // Helper: get the best source/alt from a slide
  function pullSlideSrcAlt(i) {
    const s = slides[i];
    const img = s.querySelector('img');
    if (!img) return { src: '', alt: '' };
    const full = img.getAttribute('data-full');
    return { src: full || img.currentSrc || img.src, alt: img.alt || '' };
  }

  function lbSet(i) {
    setActive(i);
    const meta = pullSlideSrcAlt(index);
    lbImg.src = meta.src;
    lbImg.alt = meta.alt;

    // update thumb highlight
    if (thumbsWrap) {
      Array.from(thumbsWrap.querySelectorAll('button')).forEach((b, bi) => {
        b.setAttribute('aria-current', bi === index ? 'true' : 'false');
      });
    }
  }

  function openLightbox(startIdx) {
    lb.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    lbSet(startIdx);
    const focusEl = lb.querySelector('.ftt-lightbox__close') || lb.querySelector('button, [tabindex]:not([tabindex="-1"])');
    focusEl && focusEl.focus && focusEl.focus();
  }

  function closeLightbox() {
    lb.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  // Build thumbnails from slides (once)
  if (thumbsWrap && !thumbsWrap.childElementCount) {
    slides.forEach((s, i) => {
      const img = s.querySelector('img');
      const src = (img && (img.currentSrc || img.src)) || '';
      const alt = (img && img.alt) || `Slide ${i + 1}`;
      const btn = document.createElement('button');
      btn.type = 'button';
      const t = document.createElement('img');
      t.src = src;
      t.alt = `Open ${alt}`;
      btn.appendChild(t);
      btn.addEventListener('click', () => lbSet(i));
      if (i === 0) btn.setAttribute('aria-current', 'true');
      thumbsWrap.appendChild(btn);
    });
  }

  // LB controls
  lbPrev && lbPrev.addEventListener('click', () => lbSet(index - 1));
  lbNext && lbNext.addEventListener('click', () => lbSet(index + 1));
  lbCloseEls.forEach(el => el.addEventListener('click', closeLightbox));
  lbBackdrop && lbBackdrop.addEventListener('click', closeLightbox);
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lbSet(index - 1);
    if (e.key === 'ArrowRight') lbSet(index + 1);
  });

  // Clicking a slide opens lightbox (prefer overlay button if present)
  slides.forEach((s, i) => {
    const trigger = s.querySelector('.feature-slide-click') || s;
    trigger.addEventListener('click', (e) => {
      // ignore clicks on caption or nav buttons inside the slide, if present
      if (e.target.closest && (e.target.closest('.feature-caption') || e.target.closest('.feature-nav'))) return;
      openLightbox(i);
    });
  });

  // Init
  setActive(0);
})();
