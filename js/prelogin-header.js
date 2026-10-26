/* Shared pre-login header behaviour: nav rail toggle + language picker.
   Deliberately dependency-free so it can load on every pre-login page. */
(function () {
  'use strict';

  window.plToggleNav = function () {
    var rail = document.querySelector('.prelogin-sidebar');
    var btn  = document.getElementById('plHamburger');
    if (!rail) return;
    var collapsed = rail.classList.toggle('pl-collapsed');
    if (btn) btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  };

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
