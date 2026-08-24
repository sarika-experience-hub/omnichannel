/*
 * azentio – Dark Theme (theme.js)
 * Load in <head> so dark class is applied before paint (no FOUC).
 */
(function () {
  if (localStorage.getItem('az-theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }
})();

function toggleDarkMode() {
  var isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('az-theme', isDark ? 'dark' : 'light');
  document.querySelectorAll('.acc-btn-theme').forEach(function (btn) {
    btn.style.background = isDark ? 'var(--az-navy, #16303d)' : '';
    btn.style.color      = isDark ? '#fff' : '';
  });
}

/* Sync button state on load + auto-wire all toggle buttons */
document.addEventListener('DOMContentLoaded', function () {
  var isDark = document.documentElement.classList.contains('dark');

  /* Wire up every theme-toggle button regardless of which class it uses */
  document.querySelectorAll('.acc-btn-theme, .acc-btn-dark').forEach(function (btn) {
    /* Only attach if not already wired via inline onclick */
    if (!btn.getAttribute('onclick')) {
      btn.addEventListener('click', toggleDarkMode);
    }
    btn.style.background = isDark ? 'var(--az-navy, #16303d)' : '';
    btn.style.color      = isDark ? '#fff' : '';
  });
});
