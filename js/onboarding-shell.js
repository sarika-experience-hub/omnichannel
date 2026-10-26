/* ══════════════════════════════════════════════════════════════
   azentio — onboarding shell behaviours
   ──────────────────────────────────────────────────────────────
   Language picker, step-rail collapse, help popovers, password
   reveal / strength / match and the step progress badge. Shared by
   the account-recovery journeys so they behave exactly like the
   Create Online Account screens.

   Every hook is defensive: a page that omits a widget simply
   doesn't wire it, so one page's missing element can never take
   down another page's behaviour.
   ══════════════════════════════════════════════════════════════ */
'use strict';

/* ── Language picker ── */
function setObLang(code, flag, btn) {
  var label = document.getElementById('obLangCode');
  if (label) label.textContent = code;
  document.documentElement.setAttribute('lang', code === 'FR' ? 'fr' : (code === 'ENG' ? 'en' : 'ar'));
  document.querySelectorAll('.ob-lang-opt').forEach(function (o) { o.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  var menu = document.getElementById('obLangMenu');
  if (menu) menu.classList.add('hidden');
}
document.addEventListener('click', function (e) {
  if (e.target.closest('.ob-lang-wrap')) return;
  var menu = document.getElementById('obLangMenu');
  if (menu) menu.classList.add('hidden');
});

/* ── Step rail collapse ── */
function toggleRail() {
  var rail = document.getElementById('obRail');
  var hamburger = document.getElementById('obHamburger');
  if (!rail) return;
  var collapsed = rail.classList.toggle('collapsed');
  if (hamburger) hamburger.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
}

/* ── Help popovers ── */
function obCloseTips() {
  document.querySelectorAll('.ob-tooltip').forEach(function (t) { t.classList.add('ob-hidden'); });
  document.querySelectorAll('.ob-info-btn').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
}
function toggleTip(e, id) {
  e.stopPropagation();
  var tip = document.getElementById(id);
  if (!tip) return;
  var wasHidden = tip.classList.contains('ob-hidden');
  obCloseTips();
  if (!wasHidden) return;
  tip.classList.remove('ob-hidden');
  var btn = tip.parentElement.querySelector('.ob-info-btn');
  if (btn) btn.setAttribute('aria-expanded', 'true');
}
document.addEventListener('click', function (e) { if (!e.target.closest('.ob-info-wrap')) obCloseTips(); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') obCloseTips(); });

/* ── Summary accordion ── */
function toggleSum(bodyId, hdrId) {
  var b = document.getElementById(bodyId), h = document.getElementById(hdrId);
  if (!b || !h) return;
  var willShow = b.classList.contains('ob-hidden');
  b.classList.toggle('ob-hidden', !willShow);
  h.classList.toggle('collapsed', !willShow);
}

/* ── Password reveal ── */
function togglePwd(inputId, btn) {
  var inp = document.getElementById(inputId);
  if (!inp) return;
  var reveal = inp.type === 'password';
  inp.type = reveal ? 'text' : 'password';
  btn.querySelector('.material-icons').textContent = reveal ? 'visibility_off' : 'visibility';
  btn.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
  btn.setAttribute('aria-pressed', reveal ? 'true' : 'false');
}

/* ── Password strength + criteria checklist ──
   pwdId / confirmId / userId name the fields to read; the meter and
   checklist are found by the ids the Create Online Account markup
   uses, so the two journeys stay visually identical. */
function obWirePassword(pwdId, confirmId, userId) {
  var pwdEl = document.getElementById(pwdId);
  if (!pwdEl) return;
  var confirmEl = confirmId ? document.getElementById(confirmId) : null;
  var userEl = userId ? document.getElementById(userId) : null;

  function strength() {
    var pwd = pwdEl.value;
    var row = document.getElementById('pwdStrengthRow');
    if (!row) return;
    if (!pwd) { row.style.display = 'none'; return; }
    row.style.display = '';
    var userName = userEl ? userEl.value : '';
    var criteria = [
      { id: 'critLen',     met: pwd.length >= 8 },
      { id: 'critUpper',   met: /[A-Z]/.test(pwd) },
      { id: 'critLower',   met: /[a-z]/.test(pwd) },
      { id: 'critNum',     met: /[0-9]/.test(pwd) },
      { id: 'critSpecial', met: /[^A-Za-z0-9]/.test(pwd) },
      { id: 'critUser',    met: !userName || pwd.toLowerCase().indexOf(userName.toLowerCase()) === -1 }
    ];
    var metCount = 0;
    criteria.forEach(function (c) {
      var el = document.getElementById(c.id);
      if (!el) return;
      el.classList.toggle('met', c.met);
      el.querySelector('.material-icons').textContent = c.met ? 'check_circle' : 'radio_button_unchecked';
      if (c.met) metCount++;
    });
    var segCount = Math.max(1, Math.ceil(metCount / criteria.length * 4));
    var level = segCount <= 1 ? 'weak' : segCount === 2 ? 'fair' : segCount === 3 ? 'good' : 'strong';
    var lbl = document.getElementById('pwdStrengthLbl');
    if (lbl) lbl.textContent = { weak: 'Weak', fair: 'Fair', good: 'Good', strong: 'Strong' }[level];
    ['pwdSeg1', 'pwdSeg2', 'pwdSeg3', 'pwdSeg4'].forEach(function (id, i) {
      var seg = document.getElementById(id);
      if (seg) seg.className = 'seg' + (i < segCount ? ' on-' + level : '');
    });
  }

  function match() {
    var el = document.getElementById('pwdMatch');
    if (!el || !confirmEl) return;
    if (!confirmEl.value) { el.className = 'pwd-match'; el.innerHTML = ''; return; }
    var ok = pwdEl.value === confirmEl.value;
    el.className = 'pwd-match ' + (ok ? 'ok' : 'no');
    el.innerHTML = '<span class="material-icons" aria-hidden="true">' +
      (ok ? 'check_circle' : 'error_outline') + '</span>' +
      (ok ? 'Passwords match' : 'Passwords do not match');
  }

  pwdEl.addEventListener('input', strength);
  pwdEl.addEventListener('input', match);
  if (userEl) userEl.addEventListener('input', strength);
  if (confirmEl) confirmEl.addEventListener('input', match);
}

/* ── Required-field validation ── */
function obValidate(formId) {
  var form = document.getElementById(formId);
  if (!form) return true;
  var valid = true, firstInvalid = null;
  form.querySelectorAll('[data-required="true"]').forEach(function (el) {
    var empty = !el.value || !el.value.trim();
    el.classList.toggle('is-invalid', empty);
    if (!empty) return;
    valid = false;
    if (!firstInvalid) firstInvalid = el;
  });
  if (!valid && firstInvalid) {
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstInvalid.focus();
  }
  return valid;
}

/* ── The rail's live progress badge ──
   badgeId is the percentage pill on the active step; the bar drawn
   under the label is driven by the same number through --ob-pct. */
function obWireProgress(formId, badgeId) {
  var form = document.getElementById(formId);
  var badge = document.getElementById(badgeId);
  if (!form) return;
  function update() {
    var reqs = form.querySelectorAll('[data-required="true"]');
    var filled = 0;
    reqs.forEach(function (el) { if (el.value && el.value.trim()) filled++; });
    var pct = reqs.length ? Math.round((filled / reqs.length) * 100) : 0;
    if (badge) {
      badge.textContent = pct + '%';
      badge.classList.remove('pct-0', 'pct-mid', 'pct-done');
      badge.classList.add(pct === 0 ? 'pct-0' : (pct === 100 ? 'pct-done' : 'pct-mid'));
    }
    var activeBody = document.querySelector('.ob-step.active .ob-step-body');
    if (activeBody) activeBody.style.setProperty('--ob-pct', pct + '%');
  }
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  update();
}

/* ── Summary rows ── */
function obSumRows(targetId, rows) {
  var box = document.getElementById(targetId);
  if (!box) return;
  box.innerHTML = rows.map(function (r) {
    return '<div class="ob-sum-row"><span class="ob-sum-k">' + r[0] + '</span>' +
           '<span class="ob-sum-v' + (r[1] ? '' : ' empty') + '">' + (r[1] || 'Not provided') + '</span></div>';
  }).join('');
}

