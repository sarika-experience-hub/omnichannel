/* ══════════════════════════════════════════════════════════════
   azentio — onboarding step rail navigation
   ──────────────────────────────────────────────────────────────
   Steps you have already reached become links, so the rail works
   as navigation rather than only as a progress read-out. Steps
   ahead stay locked: jumping to "Products" from step one would
   land the reader on a form whose earlier answers do not exist.

   "Reached" is remembered per journey and only ever grows, so
   moving back and forth never re-locks anything. Opening a step
   directly also marks it reached, so a deep link never leaves the
   rail dead.

   Leaving a step saves it first — the rail must never cost the
   reader what they just typed. Each journey passes its own saver,
   since they store their answers differently.

   This lives in its own file because the two journeys load
   different scripts: the generated "Become Our Customer" steps use
   onboarding-shell.js, while the retail and Create Online Account
   screens carry their own inline behaviours. One file means one
   definition rather than a copy in each.
   ══════════════════════════════════════════════════════════════ */
'use strict';

function obWireRail(files, current, journey, onLeave) {
  var steps = document.querySelectorAll('.ob-step');
  if (!steps.length || !files || !files.length) return;

  var key = 'az_ob_furthest_' + (journey || 'default');
  var furthest = current;
  try {
    var saved = parseInt(localStorage.getItem(key), 10);
    if (!isNaN(saved)) furthest = Math.max(saved, current);
    localStorage.setItem(key, String(furthest));
  } catch (e) { /* private mode — the rail still works, just not across visits */ }

  function go(n) {
    if (n === current) return;
    /* Save before leaving, the same way Continue and Previous do. */
    try {
      if (typeof onLeave === 'function') onLeave();
      else if (typeof obSaveStep === 'function') obSaveStep();
    } catch (e) { /* a failed save must not trap the reader on the step */ }
    window.location.href = files[n - 1];
  }

  steps.forEach(function (li, i) {
    var n = i + 1;

    /* Clear any previous wiring first. Without this a second call
       leaves a step carrying both is-locked and is-link, which reads
       as a dimmed step that still looks clickable. */
    li.classList.remove('is-current', 'is-link', 'is-locked');
    li.removeAttribute('aria-current');
    li.removeAttribute('aria-disabled');
    li.removeAttribute('role');
    li.removeAttribute('tabindex');

    if (n === current) {
      li.classList.add('is-current');
      li.setAttribute('aria-current', 'step');
      return;
    }

    if (n > furthest) {
      li.classList.add('is-locked');
      li.setAttribute('aria-disabled', 'true');
      var locked = li.querySelector('.ob-step-lbl');
      if (locked) locked.title = 'Complete the earlier steps first';
      return;
    }

    var lbl = li.querySelector('.ob-step-lbl');
    li.classList.add('is-link');
    li.setAttribute('role', 'link');
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-label', 'Go to ' + (lbl ? lbl.textContent : 'step ' + n));
    li.addEventListener('click', function () { go(n); });
    li.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(n); }
    });
  });
}
