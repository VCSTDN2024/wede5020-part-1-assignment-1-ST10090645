// Page Fade-In/Fade-Out animation
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
      document.body.classList.remove('is-visible'); // fade-out

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

/* Lightbox/Carousel */
(function () {
  const carousel = document.querySelector('.feature-carousel');
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll('.feature-slide'));

  // Arrows are outside the carousel
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

  prevBtn && prevBtn.addEventListener('click', prev);
  nextBtn && nextBtn.addEventListener('click', next);

  carousel.setAttribute('tabindex', '0');
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
  });

  // Lightbox
  const lb = document.querySelector('.ftt-lightbox');
  if (!lb) { setActive(0); return; }

  const lbImg = lb.querySelector('.ftt-lightbox__img');
  const lbPrev = lb.querySelector('.ftt-lightbox__prev');
  const lbNext = lb.querySelector('.ftt-lightbox__next');
  const lbCloseEls = lb.querySelectorAll('.ftt-lightbox__close, [data-lb-close]');
  const lbBackdrop = lb.querySelector('.ftt-lightbox__backdrop');
  const thumbsWrap = lb.querySelector('.ftt-lightbox__thumbs');

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

    // thumbnail highlight
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

  // Build thumbnails once
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

  // Lightbox controls
  lbPrev && lbPrev.addEventListener('click', () => lbSet(index - 1));
  lbNext && lbNext.addEventListener('click', () => lbSet(index + 1));
  lbCloseEls.forEach(el => el.addEventListener('click', closeLightbox));
  lbBackdrop && lbBackdrop.addEventListener('click', closeLightbox);
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lbSet(index - 1);
    if (e.key === 'ArrowRight') lbSet(index + 1);
  });

  // Clicking a slide opens lightbox
  slides.forEach((s, i) => {
    const trigger = s.querySelector('.feature-slide-click') || s;
    trigger.addEventListener('click', (e) => {
      if (e.target.closest && (e.target.closest('.feature-caption') || e.target.closest('.feature-nav'))) return;
      openLightbox(i);
    });
  });

  // Init
  setActive(0);
})();

// Shop tabs 
(function () {
  const tabsRoot = document.querySelector('.shop-tabs');
  if (!tabsRoot) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cssFade = getComputedStyle(document.documentElement).getPropertyValue('--fade-ms').trim();
  const fadeMs = parseInt(cssFade) || 300;

  const tabs = Array.from(tabsRoot.querySelectorAll('.shop-tab[role="tab"]'));
  const panels = Array.from(document.querySelectorAll('.shop-panel[role="tabpanel"]'));
  const byId = (id) => document.getElementById(id);

  function getActiveTab() {
    return tabs.find(t => t.classList.contains('is-active')) || tabs[0];
  }
  function getActivePanel() {
    return panels.find(p => p.classList.contains('is-active')) || panels[0];
  }

  function activateTab(tab) {
    tabs.forEach(t => {
      const selected = t === tab;
      t.classList.toggle('is-active', selected);
      t.setAttribute('aria-selected', selected ? 'true' : 'false');
      t.tabIndex = selected ? 0 : -1;
    });
  }

  function showPanel(panel) {
    panels.forEach(p => {
      p.classList.toggle('is-active', p === panel);
      if (p !== panel) p.classList.remove('is-hiding');
    });
  }

  function switchTo(panelId) {
    const current = getActivePanel();
    const next = byId(panelId);
    if (!next || current === next) return;

    if (!prefersReduced) {
      current.classList.add('is-hiding');
      current.classList.remove('is-active');
      setTimeout(() => {
        current.classList.remove('is-hiding');
        showPanel(next);
      }, fadeMs);
    } else {
      showPanel(next);
    }
  }

  // Click
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      activateTab(tab);
      switchTo(tab.dataset.target);
      const controlled = byId(tab.getAttribute('aria-controls'));
      controlled && controlled.focus && controlled.focus({ preventScroll: true });
    });
  });

  // Keyboard (ArrowLeft/Right)
  tabsRoot.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const next = tabs[(i + dir + tabs.length) % tabs.length];
      next.focus();
      next.click();
    }
  });

  // Init
  const initialTab = getActiveTab();
  const initialPanel = byId(initialTab?.dataset.target) || panels[0];
  activateTab(initialTab);
  showPanel(initialPanel);

  // expose switchTo for search module (scoped via dataset on root)
  tabsRoot.dataset.switchReady = '1';
})();

// Search Feature 
(function () {
  const controls = document.querySelector('.shop-controls');
  if (!controls) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cssFade = getComputedStyle(document.documentElement).getPropertyValue('--fade-ms').trim();
  const fadeMs = parseInt(cssFade) || 300;

  const tabsRoot = document.querySelector('.shop-tabs');
  const tabs = Array.from(tabsRoot.querySelectorAll('.shop-tab[role="tab"]'));
  const panels = Array.from(document.querySelectorAll('.shop-panel[role="tabpanel"]'));
  const byId = (id) => document.getElementById(id);

  const tabSearch = byId('tab-search');
  const panelSearch = byId('panel-search');
  const searchGrid = byId('searchGrid');
  const input = byId('shopQuery');
  const resetBtn = document.querySelector('.shop-search button[type="reset"]');

  // Index product cards 
  const cards = Array.from(document.querySelectorAll('.shop-panel .product-card'));
  const index = cards.map(card => {
    const name = (card.querySelector('.product-card__name')?.textContent || '').trim();
    const price = (card.querySelector('.product-card__price')?.textContent || '').trim();
    const alt = (card.querySelector('img')?.alt || '').trim();
    const hay = [name, price, alt].join(' ').toLowerCase();
    return { card, hay };
  });

  function getActivePanel() {
    return panels.find(p => p.classList.contains('is-active')) || panels[0];
  }

  function showPanel(panel) {
    panels.forEach(p => {
      p.classList.toggle('is-active', p === panel);
      if (p !== panel) p.classList.remove('is-hiding');
    });
  }

  function activateTab(tab) {
    tabs.forEach(t => {
      const selected = t === tab;
      t.classList.toggle('is-active', selected);
      t.setAttribute('aria-selected', selected ? 'true' : 'false');
      t.tabIndex = selected ? 0 : -1;
    });
  }

  function switchTo(panelId) {
    const current = getActivePanel();
    const next = byId(panelId);
    if (!next || current === next) return;

    if (!prefersReduced) {
      current.classList.add('is-hiding');
      current.classList.remove('is-active');
      setTimeout(() => {
        current.classList.remove('is-hiding');
        showPanel(next);
      }, fadeMs);
    } else {
      showPanel(next);
    }
  }

  function renderResults(q) {
    if (!panelSearch || !searchGrid) return;
    const query = (q || '').trim().toLowerCase();
    searchGrid.innerHTML = '';

    const hint = panelSearch.querySelector('.search-hint');
    if (!query) {
      if (hint) hint.textContent = 'Start typing to find items across all categories.';
      return;
    }
    if (hint) hint.textContent = '';

    const matches = index.filter(it => it.hay.includes(query));
    if (!matches.length) {
      if (hint) hint.textContent = 'No results found.';
      return;
    }
    matches.forEach(({ card }) => {
      searchGrid.appendChild(card.cloneNode(true));
    });
  }

  let timer = null;
  function onInput() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const hasQuery = !!input.value.trim();
      if (hasQuery) {
        activateTab(tabSearch);
        switchTo('panel-search');
      }
      renderResults(input.value);
    }, 160);
  }

  input && input.addEventListener('input', onInput);

  resetBtn && resetBtn.addEventListener('click', () => {
    if (!input) return;
    input.value = '';
    renderResults('');
    // go back to first tab smoothly
    const firstTab = byId('tab-tabletop') || tabs[0];
    activateTab(firstTab);
    switchTo(firstTab.dataset.target);
    input.focus();
  });

  tabSearch && tabSearch.addEventListener('click', () => {
    renderResults(input?.value || '');
    input && input.focus();
  });
})();

// Accordion FAQ section

(function () {
  const root = document.querySelector('.faq .accordion');
  if (!root) return;

  const triggers = Array.from(root.querySelectorAll('.accordion__trigger'));

  function setOpen(trigger, open) {
    const panelId = trigger.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    if (!panel) return;

    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  // Click to toggle
  triggers.forEach((btn) => {
    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      setOpen(btn, !isOpen);
    });

    // close with Escape button on keyboard when focus is inside the panel
    const panelId = btn.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          setOpen(btn, false);
          btn.focus();
        }
      });
    }
  });

  // Start closed for all
  triggers.forEach((btn) => setOpen(btn, false));
})();

// Inquiry form and validation 
(function () {
  const form = document.getElementById('bizForm');
  if (!form) return;

  const nameEl = form.querySelector('#bizName');
  const emailEl = form.querySelector('#bizEmail');
  const phoneEl = form.querySelector('#bizPhone');
  const msgEl = form.querySelector('#bizMsg');

  const modal = document.getElementById('bizModal');
  const summaryList = document.getElementById('bizSummary');

  const emailHint = emailEl.nextElementSibling;
  const phoneHint = phoneEl.nextElementSibling;
  const nameHint = nameEl.nextElementSibling;

  function setHint(el, hintEl, message, isError) {
    if (!hintEl) return;
    hintEl.textContent = message || '';
    hintEl.classList.toggle('field-hint--error', !!isError);
    el.classList.toggle('is-invalid', !!isError);
  }

  function validateName() {
    const v = nameEl.value.trim();
    if (!v) {
      setHint(nameEl, nameHint, 'Please enter your full name.', true);
      return false;
    }
    setHint(nameEl, nameHint, 'Looks good!');
    return true;
  }

  function validateEmail() {
    const v = emailEl.value.trim();
    // validation for correct email format
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    if (!ok) {
      setHint(emailEl, emailHint, 'Please enter a valid email address (e.g., you@example.com).', true);
      return false;
    }
    setHint(emailEl, emailHint, 'Looks good!');
    return true;
  }

  function validatePhone() {
    const digits = phoneEl.value.replace(/\D+/g, ''); //Validation for appropriate phone number length
    if (digits.length !== 10) {
      setHint(phoneEl, phoneHint, 'Phone must be exactly 10 digits.', true);
      return false;
    }
    setHint(phoneEl, phoneHint, 'Perfect length!');
    return true;
  }

  // Live validation as the user types
  nameEl.addEventListener('input', validateName);
  emailEl.addEventListener('input', validateEmail);
  phoneEl.addEventListener('input', () => {
    
    validatePhone();
  });

  // Submit error handling
  form.addEventListener('submit', (e) => {
  e.preventDefault();

  const okName = validateName();
  const okEmail = validateEmail();
  const okPhone = validatePhone();

  const roles = Array.from(form.querySelectorAll('input[name="roles"]:checked'))
    .map((c) => c.value);

  const hasRole = roles.length > 0;
  if (!hasRole) {
    alert('Please select at least one option under "How can we help you, help us?"');
    return;
  }

  if (!(okName && okEmail && okPhone && hasRole)) {
    const firstInvalid = form.querySelector('.is-invalid');
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  const digits = phoneEl.value.replace(/\D+/g, '');
  const summary = [
    { label: 'Name', value: nameEl.value.trim() },
    { label: 'Email', value: emailEl.value.trim() },
    { label: 'Phone', value: digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3') },
    { label: 'Roles', value: roles.join(', ') },
    { label: 'Notes', value: msgEl.value.trim() || '—' },
  ];

  summaryList.innerHTML = '';
  summary.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.label}: ${item.value}`;
    summaryList.appendChild(li);
  });

  openModal();
});

  // Modal helpers
  function openModal() {
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    
    const closeBtn = modal.querySelector('[data-close]');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  modal.addEventListener('click', (e) => {
    if (e.target.matches('[data-close]') || e.target.classList.contains('modal__backdrop')) {
      closeModal();
    }
  });

  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
})();


