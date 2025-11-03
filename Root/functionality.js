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
