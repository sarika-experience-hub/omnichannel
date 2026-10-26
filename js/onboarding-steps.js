/* ══════════════════════════════════════════════════════════════
   azentio — onboarding step behaviours
   ──────────────────────────────────────────────────────────────
   Selfie capture, the signature pad and the conditional product
   blocks. Loaded by all eight "Become Our Customer" steps; each
   hook checks for its own elements first, so a step that doesn't
   use a widget simply never wires it.
   ══════════════════════════════════════════════════════════════ */
'use strict';


/* ── Step 6: signature ── */
function obSigMode(mode) {
  var draw = document.getElementById('sigDraw');
  var up = document.getElementById('sigUpload');
  if (!draw || !up) return;
  var drawing = mode === 'draw';
  draw.classList.toggle('hidden', !drawing);
  up.classList.toggle('hidden', drawing);
  var td = document.getElementById('sigTabDraw');
  var tu = document.getElementById('sigTabUpload');
  td.classList.toggle('active', drawing);
  tu.classList.toggle('active', !drawing);
  td.setAttribute('aria-selected', String(drawing));
  tu.setAttribute('aria-selected', String(!drawing));
}

(function wireSignature() {
  var c = document.getElementById('sigCanvas');
  if (!c) return;
  var ctx = c.getContext('2d');
  var drawing = false;

  /* The canvas is sized in CSS but drawn in its own pixel space, so
     pointer coordinates are scaled to match or the ink lands offset. */
  function pos(e) {
    var r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width),
             y: (e.clientY - r.top) * (c.height / r.height) };
  }
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#16303d';

  c.addEventListener('pointerdown', function (e) {
    drawing = true;
    c.setPointerCapture(e.pointerId);
    var p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  });
  c.addEventListener('pointermove', function (e) {
    if (!drawing) return;
    var p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (evt) {
    c.addEventListener(evt, function () { drawing = false; });
  });
})();

function obSigClear() {
  var c = document.getElementById('sigCanvas');
  if (!c) return;
  c.getContext('2d').clearRect(0, 0, c.width, c.height);
}
function obSigConfirm() {
  var c = document.getElementById('sigCanvas');
  if (!c) return;
  /* A blank canvas is all-transparent; if nothing was drawn, say so
     rather than accepting an empty signature. */
  var data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  var inked = false;
  for (var i = 3; i < data.length; i += 4) { if (data[i] !== 0) { inked = true; break; } }
  obToast(inked ? 'Signature saved' : 'Draw your signature first');
}

/* ── Step 8: conditional product blocks ── */
function obToggleCheq(chk) {
  var f = document.getElementById('cheqFields');
  if (f) f.classList.toggle('hidden', !chk.checked);
}
function obToggleLoan(chk) {
  var f = document.getElementById('loanFields');
  if (f) f.classList.toggle('hidden', !chk.checked);
}
function obSubmit() {
  if (typeof obValidate === 'function' && !obValidate('obForm')) return;
  openModal('obDone');
}

/* ── Toast ── */
function obToast(msg) {
  var t = document.getElementById('obToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'obToast';
    t.setAttribute('role', 'status');
    t.style.cssText = 'position:fixed;left:50%;bottom:1.5rem;transform:translateX(-50%) translateY(1rem);' +
      'background:#16303d;color:#fff;padding:.6rem 1.1rem;border-radius:.5rem;font-size:var(--fs-small);' +
      'font-family:var(--az-font);box-shadow:0 8px 24px rgba(16,32,48,.22);opacity:0;' +
      'transition:opacity .2s,transform .2s;z-index:2000;pointer-events:none;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(function () { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
  clearTimeout(obToast._t);
  obToast._t = setTimeout(function () {
    t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(1rem)';
  }, 2200);
}

/* ══════════════════════════════════════════════════════════════
   Carrying entries forward
   ──────────────────────────────────────────────────────────────
   Each step stores what was typed, and every later step reads the
   earlier ones back into the right panel. Only the step just
   completed stays expanded — the ones before it collapse, so the
   panel grows without turning into a wall of text.
   ══════════════════════════════════════════════════════════════ */

var OB_KEY = 'az_onboarding_';

/* OB_STEP and OB_FIELDS are declared by each page. */
function obSaveStep() {
  if (typeof OB_STEP === 'undefined' || typeof OB_FIELDS === 'undefined') return;
  var data = {};
  OB_FIELDS.forEach(function (f) {
    var el = document.getElementById(f[1]);
    if (!el) return;
    if (el.type === 'checkbox') { data[f[0]] = el.checked ? 'Yes' : 'No'; return; }
    if (el.type === 'file') { data[f[0]] = el.files && el.files[0] ? el.files[0].name : ''; return; }
    data[f[0]] = (el.value || '').trim();
  });
  /* A radio group is read from whichever option is selected. */
  (window.OB_RADIOS || []).forEach(function (r) {
    var sel = document.querySelector('input[name="' + r[1] + '"]:checked');
    data[r[0]] = sel ? (sel.getAttribute('data-label') || sel.closest('label').textContent.trim().split('\n')[0]) : '';
  });
  /* Steps that capture rather than type (selfie, signature) contribute
     their state through OB_SYNTH. */
  if (typeof OB_SYNTH === 'function') {
    var extra = OB_SYNTH();
    Object.keys(extra).forEach(function (k) { data[k] = extra[k]; });
  }
  try { localStorage.setItem(OB_KEY + OB_STEP, JSON.stringify(data)); } catch (e) {}
}

function obNext(href) {
  obSaveStep();
  window.location.href = href;
}

/* Rebuild the right panel from every step before this one. */
function obBuildSummary(stepTitles) {
  var box = document.getElementById('obSummary');
  if (!box || typeof OB_STEP === 'undefined') return;
  var html = '';
  var lastFilled = 0;

  for (var n = 1; n < OB_STEP; n++) {
    var raw = null;
    try { raw = localStorage.getItem(OB_KEY + n); } catch (e) {}
    if (!raw) continue;
    var d;
    try { d = JSON.parse(raw); } catch (e) { continue; }
    var keys = Object.keys(d);
    if (!keys.length) continue;
    lastFilled = n;
  }

  for (var n = 1; n < OB_STEP; n++) {
    var raw = null;
    try { raw = localStorage.getItem(OB_KEY + n); } catch (e) {}
    var d = {};
    if (raw) { try { d = JSON.parse(raw); } catch (e) { d = {}; } }
    var keys = Object.keys(d);
    if (!keys.length) continue;

    /* Only the most recently completed step stays open. */
    var open = n === lastFilled;
    var rows = keys.map(function (k) {
      var v = d[k];
      return '<div class="ob-sum-row"><span class="ob-sum-k">' + k + '</span>' +
             '<span class="ob-sum-v' + (v ? '' : ' empty') + '">' + (v || 'Not provided') + '</span></div>';
    }).join('');

    html +=
      '<div class="ob-sum-grp">' +
        '<div class="ob-sum-hdr' + (open ? '' : ' collapsed') + '" id="sumHdr' + n + '" onclick="toggleSum(\'sumBody' + n + '\',\'sumHdr' + n + '\')">' +
          '<span class="ob-sum-hdr-l"><span class="ob-sum-tick"><span class="material-icons">check</span></span>' + stepTitles[n - 1] + '</span>' +
          '<span class="material-icons">expand_more</span>' +
        '</div>' +
        '<div class="ob-sum-body' + (open ? '' : ' ob-hidden') + '" id="sumBody' + n + '">' + rows + '</div>' +
      '</div>';
  }

  box.innerHTML = html || '<div class="ob-sum-empty">Nothing entered yet.</div>';
}

/* Put back what this step already holds, so Previous never loses it. */
function obRestoreStep() {
  if (typeof OB_STEP === 'undefined' || typeof OB_FIELDS === 'undefined') return;
  var raw = null;
  try { raw = localStorage.getItem(OB_KEY + OB_STEP); } catch (e) {}
  if (!raw) return;
  var d;
  try { d = JSON.parse(raw); } catch (e) { return; }
  OB_FIELDS.forEach(function (f) {
    var el = document.getElementById(f[1]);
    if (!el || el.type === 'file' || !d[f[0]]) return;
    if (el.type === 'checkbox') el.checked = d[f[0]] === 'Yes';
    else el.value = d[f[0]];
  });
}


/* Has anything actually been drawn on the signature pad? */
function obSigInked() {
  var c = document.getElementById('sigCanvas');
  if (!c) return false;
  var d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  for (var i = 3; i < d.length; i += 4) { if (d[i] !== 0) return true; }
  return false;
}
