/* Shared pre-login header behaviour: nav rail toggle + language picker.
   Deliberately dependency-free so it can load on every pre-login page. */
(function () {
  'use strict';

  function plIsOverlay() {
    return window.matchMedia && window.matchMedia('(max-width: 991.98px)').matches;
  }

  function plScrim(show) {
    var s = document.getElementById('plScrim');
    if (show) {
      if (!s) {
        s = document.createElement('div');
        s.id = 'plScrim';
        s.className = 'pl-scrim';
        s.addEventListener('click', function () { window.plToggleNav(); });
        document.body.appendChild(s);
      }
      s.hidden = false;
    } else if (s) {
      s.hidden = true;
    }
  }

  window.plToggleNav = function () {
    var rail = document.querySelector('.prelogin-sidebar');
    var btn  = document.getElementById('plHamburger');
    if (!rail) return;

    /* Overlaid, the rail slides in and out over the page; docked, it still
       collapses its width the way it always did. */
    if (plIsOverlay()) {
      var open = rail.classList.toggle('pl-open');
      plScrim(open);
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      return;
    }

    var collapsed = rail.classList.toggle('pl-collapsed');
    if (btn) btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  };

  /* The tray starts closed on a small screen, whatever the markup says. */
  function plSyncNav() {
    var rail = document.querySelector('.prelogin-sidebar');
    var btn  = document.getElementById('plHamburger');
    if (!rail) return;
    if (plIsOverlay()) {
      rail.classList.remove('pl-open');
      plScrim(false);
      if (btn) btn.setAttribute('aria-expanded', 'false');
    } else {
      rail.classList.remove('pl-open');
      plScrim(false);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', plSyncNav);
  } else {
    plSyncNav();
  }
  window.addEventListener('resize', plSyncNav);

  window.plToggleLang = function (e) {
    if (e) e.stopPropagation();
    var m = document.getElementById('plLangMenu');
    if (m) m.hidden = !m.hidden;
  };

  window.plSetLang = function (code, flag, btn) {
    var c = document.getElementById('plLangCode');
    if (c) c.textContent = code;
    document.documentElement.setAttribute('lang', code === 'FR' ? 'fr' : (code === 'ENG' ? 'en' : 'ar'));
    document.querySelectorAll('.pl-lang-opt').forEach(function (o) { o.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    var m = document.getElementById('plLangMenu');
    if (m) m.hidden = true;
  };

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.pl-lang-wrap')) {
      var m = document.getElementById('plLangMenu');
      if (m) m.hidden = true;
    }
  });
})();
