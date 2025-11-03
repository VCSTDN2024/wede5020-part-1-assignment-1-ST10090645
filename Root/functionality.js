// Page Fade-In/Fade-Out animation
; (function () {
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
; (function () {
  const carousel = document.querySelector('.feature-carousel');
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll('.feature-slide'));
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

  lbPrev && lbPrev.addEventListener('click', () => lbSet(index - 1));
  lbNext && lbNext.addEventListener('click', () => lbSet(index + 1));
  lbCloseEls.forEach(el => el.addEventListener('click', closeLightbox));
  lbBackdrop && lbBackdrop.addEventListener('click', closeLightbox);
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lbSet(index - 1);
    if (e.key === 'ArrowRight') lbSet(index + 1);
  });

  slides.forEach((s, i) => {
    const trigger = s.querySelector('.feature-slide-click') || s;
    trigger.addEventListener('click', (e) => {
      if (e.target.closest && (e.target.closest('.feature-caption') || e.target.closest('.feature-nav'))) return;
      openLightbox(i);
    });
  });

  setActive(0);
})();

// Shop tabs 
; (function () {
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

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      activateTab(tab);
      switchTo(tab.dataset.target);
      const controlled = byId(tab.getAttribute('aria-controls'));
      controlled && controlled.focus && controlled.focus({ preventScroll: true });
    });
  });

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

  const initialTab = getActiveTab();
  const initialPanel = byId(initialTab?.dataset.target) || panels[0];
  activateTab(initialTab);
  showPanel(initialPanel);
  tabsRoot.dataset.switchReady = '1';
})();

// Search Feature 
; (function () {
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
; (function () {
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

  triggers.forEach((btn) => {
    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      setOpen(btn, !isOpen);
    });

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

  triggers.forEach((btn) => setOpen(btn, false));
})();

// Inquiry form and validation 
; (function () {
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
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    if (!ok) {
      setHint(emailEl, emailHint, 'Please enter a valid email address (e.g., you@example.com).', true);
      return false;
    }
    setHint(emailEl, emailHint, 'Looks good!');
    return true;
  }

  function validatePhone() {
    const digits = phoneEl.value.replace(/\D+/g, '');
    if (digits.length !== 10) {
      setHint(phoneEl, phoneHint, 'Phone must be exactly 10 digits.', true);
      return false;
    }
    setHint(phoneEl, phoneHint, 'Perfect length!');
    return true;
  }

  nameEl.addEventListener('input', validateName);
  emailEl.addEventListener('input', validateEmail);
  phoneEl.addEventListener('input', validatePhone);

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const okName = validateName();
    const okEmail = validateEmail();
    const okPhone = validatePhone();
    const roles = Array.from(form.querySelectorAll('input[name="roles"]:checked')).map((c) => c.value);
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
    if (e.target.matches('[data-close]') || e.target.classList.contains('modal__backdrop')) closeModal();
  });
  modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
})();

// Contact page form and modal + AJAX email via Google Apps Script
; (function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const nameEl = form.querySelector('#cName');
  const surnameEl = form.querySelector('#cSurname');
  const ageEl = form.querySelector('#cAge');
  const genderEl = form.querySelector('#cGender');
  const cityEl = form.querySelector('#cCity');
  const phoneEl = form.querySelector('#cPhone');
  const emailEl = form.querySelector('#cEmail');
  const jobEl = form.querySelector('#cJob');
  const msgEl = form.querySelector('#cMessage');
  const modal = document.getElementById('contactModal');
  const submitBtn = form.querySelector('button[type="submit"]');

  const endpoint = "https://script.google.com/macros/s/AKfycbyMNxm3KP05n2uqKRRy30rjB5n50uoS6fw01mOAKm1ElmXV27fSYcsrBgu3dGxfo5K99Q/exec";

  function hintFor(el) {
    return el?.nextElementSibling?.matches('.field-hint') ? el.nextElementSibling : null;
  }
  function setHint(el, message, isError) {
    const hint = hintFor(el);
    if (!hint) return;
    hint.textContent = message || '';
    hint.classList.toggle('field-hint--error', !!isError);
    el.classList.toggle('is-invalid', !!isError);
  }

  function reqText(el, label) {
    const v = el.value.trim();
    if (!v) { setHint(el, `Please enter your ${label}.`, true); return false; }
    setHint(el, 'Looks good!'); return true;
  }
  function validateEmail() {
    const v = emailEl.value.trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    if (!ok) { setHint(emailEl, 'Please enter a valid email address (e.g., you@example.com).', true); return false; }
    setHint(emailEl, 'Looks good!'); return true;
  }
  function validatePhone() {
    const digits = phoneEl.value.replace(/\D+/g, '');
    if (digits.length !== 10) { setHint(phoneEl, 'Phone must be exactly 10 digits.', true); return false; }
    setHint(phoneEl, 'Perfect length!'); return true;
  }
  function validateAge() {
    const n = Number(ageEl.value);
    if (!Number.isFinite(n) || n < 1 || n > 120) { setHint(ageEl, 'Please enter a valid age (1–120).', true); return false; }
    setHint(ageEl, 'Looks good!'); return true;
  }
  function validateGender() {
    if (!genderEl.value) { setHint(genderEl, 'Please select a gender option.', true); return false; }
    setHint(genderEl, 'Thanks!'); return true;
  }

  nameEl.addEventListener('input', () => reqText(nameEl, 'name'));
  surnameEl.addEventListener('input', () => reqText(surnameEl, 'surname'));
  cityEl.addEventListener('input', () => reqText(cityEl, 'city'));
  jobEl.addEventListener('input', () => reqText(jobEl, 'occupation'));
  msgEl.addEventListener('input', () => reqText(msgEl, 'message'));
  emailEl.addEventListener('input', validateEmail);
  phoneEl.addEventListener('input', validatePhone);
  ageEl.addEventListener('input', validateAge);
  genderEl.addEventListener('change', validateGender);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const ok =
      reqText(nameEl, 'name') &&
      reqText(surnameEl, 'surname') &&
      validateAge() &&
      validateGender() &&
      reqText(cityEl, 'city') &&
      validatePhone() &&
      validateEmail() &&
      reqText(jobEl, 'occupation') &&
      reqText(msgEl, 'message');

    if (!ok) {
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const payload = {
      name: nameEl.value.trim(),
      surname: surnameEl.value.trim(),
      age: ageEl.value.trim(),
      gender: genderEl.value,
      city: cityEl.value.trim(),
      phone: phoneEl.value.replace(/\D+/g, ''),
      email: emailEl.value.trim(),
      occupation: jobEl.value.trim(),
      message: msgEl.value.trim()
    };

    // Show "Processing..." and disable button to prevent multiple submissions at once
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });

      let okResp = false;
      const text = await res.text();
      try { const data = JSON.parse(text); okResp = !!data.ok; }
      catch { okResp = /ok/i.test(text); }

      if (okResp) {
        openModal();
        form.reset();
        [nameEl, surnameEl, ageEl, genderEl, cityEl, phoneEl, emailEl, jobEl, msgEl].forEach((el) => setHint(el, ''));
      } else {
        alert("We couldn't send your message right now. Please try again later.");
        console.error("GAS response:", text);
      }
    } catch (err) {
      alert("Network error. Please try again.");
      console.error(err);
    } finally {
      // Revert the button 
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

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
    if (e.target.matches('[data-close]') || e.target.classList.contains('modal__backdrop')) closeModal();
  });
  modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
})();
