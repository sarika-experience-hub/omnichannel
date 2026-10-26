/* ══════════════════════════════════════════════════════════════
   azentio — account recovery behaviours
   ──────────────────────────────────────────────────────────────
   The guidance accordion and the searchable country / ISD-code
   combobox, shared by the forgot-username and forgot-password
   journeys. Lifted from the Create Online Account screens so the
   mobile-number field behaves identically in both.

   Loads after onboarding-shell.js, which supplies the shell's own
   behaviours (language picker, rail, tooltips, passwords).
   ══════════════════════════════════════════════════════════════ */
'use strict';

/* ── Guidance accordion ── */
function toggleGuide(hdr) {
  var body = hdr.nextElementSibling;
  var open = hdr.getAttribute('aria-expanded') === 'true';
  body.classList.toggle('ob-hidden', open);
  hdr.setAttribute('aria-expanded', open ? 'false' : 'true');
}

/* ── Country / ISD-code combobox ──
   Flags alone aren't identifiable, so the panel is searchable by
   country name as well as by dialling code. */
var PHONE_COUNTRIES = [
  { code: 'ae', name: 'United Arab Emirates', dial: '+971' },
  { code: 'sa', name: 'Saudi Arabia',         dial: '+966' },
  { code: 'bh', name: 'Bahrain',              dial: '+973' },
  { code: 'kw', name: 'Kuwait',               dial: '+965' },
  { code: 'om', name: 'Oman',                 dial: '+968' },
  { code: 'qa', name: 'Qatar',                dial: '+974' },
  { code: 'lb', name: 'Lebanon',              dial: '+961' },
  { code: 'eg', name: 'Egypt',                dial: '+20'  },
  { code: 'jo', name: 'Jordan',               dial: '+962' },
  { code: 'us', name: 'United States',        dial: '+1'   },
  { code: 'gb', name: 'United Kingdom',       dial: '+44'  },
  { code: 'fr', name: 'France',               dial: '+33'  },
  { code: 'de', name: 'Germany',              dial: '+49'  },
  { code: 'in', name: 'India',                dial: '+91'  },
  { code: 'pk', name: 'Pakistan',             dial: '+92'  },
  { code: 'ph', name: 'Philippines',          dial: '+63'  }
];

function phoneCtryRender(key, list) {
  var listEl = document.getElementById(key + 'CtryList');
  if (!listEl) return;
  listEl.innerHTML = '';
  if (!list.length) {
    listEl.innerHTML = '<div class="phone-ctry-empty">No matches found</div>';
    return;
  }
  list.forEach(function (c) {
    var item = document.createElement('div');
    item.className = 'phone-ctry-opt';
    item.setAttribute('role', 'option');
    item.innerHTML = '<span class="fi fi-' + c.code + '"></span>' +
                     '<span class="phone-ctry-opt-name">' + c.name + '</span>' +
                     '<span class="phone-ctry-opt-dial">' + c.dial + '</span>';
    item.onmousedown = function (e) { e.preventDefault(); phoneCtrySelect(key, c); };
    listEl.appendChild(item);
  });
}

/* The panel is moved to <body> so the card it sits in can never clip it. */
function phoneCtryPosition(key) {
  var combo = document.getElementById(key + 'PhoneCombo');
  var panel = document.getElementById(key + 'CtryPanel');
  if (!combo || !panel) return;
  if (panel.parentElement !== document.body) document.body.appendChild(panel);
  var r = combo.getBoundingClientRect();
  panel.style.left = r.left + 'px';
  panel.style.top = (r.bottom + 4) + 'px';
}

function phoneCtryOpen(key) {
  var panel = document.getElementById(key + 'CtryPanel');
  var btn = document.getElementById(key + 'PhonePfxBtn');
  if (!panel) return;
  panel.classList.remove('hidden');
  if (btn) btn.setAttribute('aria-expanded', 'true');
  phoneCtryPosition(key);
  phoneCtryRender(key, PHONE_COUNTRIES);
  var search = document.getElementById(key + 'CtrySearch');
  if (!search) return;
  search.value = '';
  setTimeout(function () { search.focus(); }, 0);
}

function phoneCtryClose(key) {
  var panel = document.getElementById(key + 'CtryPanel');
  var btn = document.getElementById(key + 'PhonePfxBtn');
  if (panel) panel.classList.add('hidden');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

function phoneCtryToggle(key) {
  var panel = document.getElementById(key + 'CtryPanel');
  if (!panel) return;
  if (panel.classList.contains('hidden')) phoneCtryOpen(key); else phoneCtryClose(key);
}

function phoneCtryFilter(key, q) {
  var needle = q.toLowerCase();
  phoneCtryRender(key, PHONE_COUNTRIES.filter(function (c) {
    return c.name.toLowerCase().indexOf(needle) > -1 || c.dial.indexOf(needle) > -1;
  }));
}

function phoneCtrySelect(key, c) {
  var flag = document.getElementById(key + 'CtryFlag');
  var dial = document.getElementById(key + 'CtryDial');
  var combo = document.getElementById(key + 'PhoneCombo');
  if (flag) flag.className = 'fi fi-' + c.code;
  if (dial) dial.textContent = c.dial;
  if (combo) { combo.dataset.code = c.code; combo.dataset.dial = c.dial; }
  phoneCtryClose(key);
  var num = document.getElementById('mobileNum');
  if (num) num.focus();
}

document.addEventListener('click', function (e) {
  document.querySelectorAll('.phone-ctry-panel').forEach(function (panel) {
    if (panel.classList.contains('hidden')) return;
    var key = panel.id.replace('CtryPanel', '');
    var combo = document.getElementById(key + 'PhoneCombo');
    if (combo && !combo.contains(e.target) && !panel.contains(e.target)) phoneCtryClose(key);
  });
});

['scroll', 'resize'].forEach(function (evt) {
  window.addEventListener(evt, function () {
    document.querySelectorAll('.phone-ctry-panel').forEach(function (panel) {
      if (!panel.classList.contains('hidden')) phoneCtryPosition(panel.id.replace('CtryPanel', ''));
    });
  }, true);
});

/* ── "One of CIF / account / card" ──
   A requirement the shared data-required sweep can't express, so the
   recovery pages check it through here. */
function recoveryOneOf(errorId) {
  var ids = ['cifNo', 'acctNo', 'cardNo'];
  var filled = ids.some(function (id) {
    var el = document.getElementById(id);
    return el && el.value.trim();
  });
  var err = document.getElementById(errorId);
  if (err) err.textContent = filled ? '' : 'Enter your CIF number, account number or card number.';
  if (!filled) {
    var first = document.getElementById('cifNo');
    if (first) first.focus();
  }
  return filled;
}
